import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { db } from "../database/banco-mongo.js";
import Stripe from "stripe";

interface AutenticacaoRequest extends Request {
    usuarioId?: string;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-11-17.clover",
});

// DEBUG: verificar se a chave secreta do Stripe foi carregada corretamente (não logamos a chave inteira)
console.log('DEBUG: STRIPE_SECRET_KEY present =', !!process.env.STRIPE_SECRET_KEY)
console.log('DEBUG: STRIPE_SECRET_KEY startsWith sk_ =', process.env.STRIPE_SECRET_KEY?.startsWith('sk_'))

interface ItemCarrinho {
    produtoId: string;
    quantidade: number;
    precoUnitario: number;
    nome: string;
    urlfoto: string;
    descricao: string;
}

interface Carrinho {
    _id?: ObjectId;
    usuarioId: string;
    itens: ItemCarrinho[];
    dataAtualizacao: Date;
    total: number;
}


class CarrinhoController {
    
    async adicionarItem(req: AutenticacaoRequest, res: Response) {
        const { produtoId, quantidade } = req.body;
        const usuarioId = req.usuarioId;

        if (!usuarioId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        
        if (!produtoId || typeof quantidade !== 'number' || quantidade <= 0) {
            return res.status(400).json({ message: "Dados do item inválidos" });
        }
        
        
        const produto = await db.collection("produtos").findOne({ _id: new ObjectId(produtoId) });
        
        if (!produto) {
            return res.status(400).json({ message: "Produto não encontrado" });
        }
        
        
        const precoUnitario = produto.preco;
        const nome = produto.nome;
        const urlfoto = produto.urlfoto || '';
        const descricao = produto.descricao || '';
        
    
        const carrinho = await db.collection<Carrinho>("Carrinho").findOne({ usuarioId: usuarioId });
        
        if (!carrinho) {
        
            const novoCarrinho: Carrinho = {
                usuarioId: usuarioId,
                itens: [{
                    produtoId: produtoId,
                    quantidade: quantidade,
                    precoUnitario: precoUnitario,
                    nome: nome,
                    urlfoto: urlfoto,
                    descricao: descricao
                }],
                dataAtualizacao: new Date(),
                total: precoUnitario * quantidade
            };
            
            await db.collection("Carrinho").insertOne(novoCarrinho);
            return res.status(201).json(novoCarrinho);
        }
        
      
        const itemExistente = carrinho.itens.find(item => item.produtoId === produtoId);
        
        if (itemExistente) {
           
            itemExistente.quantidade += quantidade;
        } else {
            
            carrinho.itens.push({
                produtoId: produtoId,
                quantidade: quantidade,
                precoUnitario: precoUnitario,
                nome: nome,
                urlfoto: urlfoto,
                descricao: descricao
            });
        }
        
      
        carrinho.total = carrinho.itens.reduce((acc, item) => 
            acc + (item.precoUnitario * item.quantidade), 0
        );
        carrinho.dataAtualizacao = new Date();

        await db.collection("Carrinho").updateOne(
            { usuarioId: usuarioId },
            { 
                $set: { 
                    itens: carrinho.itens, 
                    total: carrinho.total, 
                    dataAtualizacao: carrinho.dataAtualizacao 
                } 
            }
        );

        return res.status(200).json(carrinho);
    }

    
    async removerItem(req: AutenticacaoRequest, res: Response) {
        const { produtoId } = req.body;
        const usuarioId = req.usuarioId;

        if (!usuarioId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        
        const carrinho = await db.collection<Carrinho>("Carrinho").findOne({ usuarioId: usuarioId });

        if (!carrinho) {
            return res.status(404).json({ message: "Carrinho não encontrado" });
        }
        
        const itemIndex = carrinho.itens.findIndex(item => item.produtoId === produtoId);
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item não encontrado no carrinho" });
        }
        
        
        carrinho.itens.splice(itemIndex, 1);
        
        
        carrinho.total = carrinho.itens.reduce((acc, item) => 
            acc + (item.precoUnitario * item.quantidade), 0
        );
        carrinho.dataAtualizacao = new Date();
        
        await db.collection("Carrinho").updateOne(
            { usuarioId: usuarioId },
            { 
                $set: { 
                    itens: carrinho.itens, 
                    total: carrinho.total, 
                    dataAtualizacao: carrinho.dataAtualizacao 
                } 
            }
        );
        
        return res.status(200).json(carrinho);
    }


        async removerunidadeItem(req: AutenticacaoRequest, res: Response) {
            const { produtoId } = req.body;
            const usuarioId = req.usuarioId;
    
            if (!usuarioId) {
                return res.status(401).json({ message: "Usuário não autenticado" });
            }
    
            const carrinho = await db.collection<Carrinho>("Carrinho").findOne({ usuarioId: usuarioId });
    
            if (!carrinho) {
                return res.status(404).json({ message: "Carrinho não encontrado" });
            }
    
            const itemIndex = carrinho.itens.findIndex(item => item.produtoId === produtoId);
            if (itemIndex === -1) {
                return res.status(404).json({ message: "Item não encontrado no carrinho" });
            }
    
            const item = carrinho.itens[itemIndex];
            if (!item) {
               
                return res.status(404).json({ message: "Item não encontrado no carrinho" });
            }
            
            if (item.quantidade > 1) {
                
                item.quantidade -= 1;
            } else if (item.quantidade === 1) {
               
                carrinho.itens.splice(itemIndex, 1);
            } else {
                return res.status(400).json({ message: "Quantidade inválida para remoção" });
            }
    
            
            carrinho.total = carrinho.itens.reduce((acc, currentItem) => 
                acc + (currentItem.precoUnitario * currentItem.quantidade), 0
            );
            carrinho.dataAtualizacao = new Date();
    
            
            await db.collection("Carrinho").updateOne(
                { usuarioId: usuarioId },
                { 
                    $set: { 
                        itens: carrinho.itens, 
                        total: carrinho.total, 
                        dataAtualizacao: carrinho.dataAtualizacao 
                    } 
                }
            );
    
            return res.status(200).json(carrinho);
        }

    async atualizarQuantidade(req: AutenticacaoRequest, res: Response) {
        const { produtoId, quantidade } = req.body;
        const usuarioId = req.usuarioId;
        
        if (!usuarioId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        
        if (typeof quantidade !== 'number' || quantidade <= 0) {
            return res.status(400).json({ message: "Quantidade deve ser maior que zero" });
        }

        const carrinho = await db.collection<Carrinho>("Carrinho").findOne({ usuarioId: usuarioId });
        
        if (!carrinho) {
            return res.status(404).json({ message: "Carrinho não encontrado" });
        }
        
        const item = carrinho.itens.find(item => item.produtoId === produtoId);
        
        if (!item) {
            return res.status(404).json({ message: "Item não encontrado no carrinho" });
        }
        
        
        item.quantidade = quantidade;
        
        
        carrinho.total = carrinho.itens.reduce((acc, item) => 
            acc + (item.precoUnitario * item.quantidade), 0
        );
        carrinho.dataAtualizacao = new Date();
        
        await db.collection("Carrinho").updateOne(
            { usuarioId: usuarioId },
            { 
                $set: { 
                    itens: carrinho.itens, 
                    total: carrinho.total, 
                    dataAtualizacao: carrinho.dataAtualizacao 
                } 
            }
        );
        
        return res.status(200).json(carrinho);
    }
    
    
    async listar(req: AutenticacaoRequest, res: Response) {
        const usuarioId = req.usuarioId;    

        if (!usuarioId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        
        const carrinho = await db.collection<Carrinho>("Carrinho").findOne({ usuarioId: usuarioId });
        
        if (!carrinho) {
            
            return res.status(200).json({ 
                usuarioId: usuarioId, 
                itens: [], 
                dataAtualizacao: new Date(), 
                total: 0 
            });
        }
             

        // Otimização: Apenas atualiza dados de exibição se estiverem faltando (mas não salva no DB)
        for (const item of carrinho.itens) {
            if (!item.urlfoto || !item.descricao) {
                const produto = await db.collection("produtos").findOne({ 
                    _id: new ObjectId(item.produtoId) 
                });
                
                if (produto) {
                    item.urlfoto = produto.urlfoto || '';
                    item.descricao = produto.descricao || '';
                }
            }
        }
        
        return res.status(200).json(carrinho);
    }
    
    
async listarTodosCarrinhosAdmin(req: Request, res: Response) {
        try {
            // A pipeline de agregação une a coleção 'Carrinho' com a coleção 'usuarios'.
            const carrinhosComUsuarios = await db.collection("Carrinho").aggregate([
                {
                    $lookup: {
                        from: "usuarios",        // Nome da coleção a juntar
                        localField: "usuarioId", // Campo no CarrinhoController (string)
                        foreignField: "_id",     // Campo correspondente no UsuariosController (ObjectId)
                        as: "dadosUsuario"       // Nome do array onde os dados unidos serão colocados
                    }
                },
                {
                    // Desestrutura o array de dadosUsuario (espera-se que seja um único usuário)
                    $unwind: {
                        path: "$dadosUsuario",
                        preserveNullAndEmptyArrays: true // Mantém carrinhos sem usuário correspondente (se houver)
                    }
                },
                {
                    // Projeta (formata) o resultado final
                    $project: {
                        _id: 1,
                        usuarioId: 1,
                        itens: 1,
                        dataAtualizacao: 1,
                        total: 1,
                        // Extrai nome e email do usuário unido
                        usuarioNome: { $ifNull: ["$dadosUsuario.nome", "Usuário Deletado"] },
                        usuarioEmail: { $ifNull: ["$dadosUsuario.email", "N/A"] },
                    }
                }
            ]).toArray();

            return res.status(200).json(carrinhosComUsuarios);
        } catch (error) {
            console.error("Erro ao listar todos os carrinhos (Admin):", error);
            return res.status(500).json({ message: "Erro interno do servidor." });
        }
    }

    async remover(req: AutenticacaoRequest, res: Response) {
        const usuarioId = req.usuarioId;

        if (!usuarioId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }

        const resultado = await db.collection("Carrinho").deleteOne({ usuarioId: usuarioId });
        
        if (resultado.deletedCount === 0) {
            return res.status(404).json({ message: "Carrinho não encontrado" });
        }
        
        return res.status(200).json({ message: "Carrinho removido com sucesso" });
    }
    async criarPagamento(req: AutenticacaoRequest, res: Response) {
        try {
            const usuarioId = req.usuarioId;

            if (!usuarioId) {
                return res.status(401).json({ mensagem: "Usuário não autenticado" });
            }

            // Buscar o carrinho do usuário no banco de dados
            const carrinho = await db.collection<Carrinho>("Carrinho").findOne({ usuarioId });

            if (!carrinho || !Array.isArray(carrinho.itens) || carrinho.itens.length === 0) {
                return res.status(400).json({ mensagem: "Carrinho vazio ou não encontrado" });
            }

            // Converter total para centavos (Stripe usa a menor unidade)
            const amountInCents = Math.round((carrinho.total || 0) * 100);

            if (amountInCents <= 0) {
                return res.status(400).json({ mensagem: "Valor do carrinho inválido" });
            }

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: "brl",
                payment_method_types: ["card"],
                metadata: {
                    usuarioId: usuarioId,
                    pedido_id: carrinho._id?.toString() || "unknown",
                },
            });

            return res.json({ clientSecret: paymentIntent.client_secret });
        } catch (err) {
            if (err instanceof Error) {
                return res.status(400).json({ mensagem: err.message });
            }
            return res.status(400).json({ mensagem: "Erro de pagamento desconhecido!" });
        }
    }
}

export default new CarrinhoController();