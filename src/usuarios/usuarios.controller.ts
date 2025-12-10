import { Request, Response } from 'express'
import { db } from '../database/banco-mongo.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

class UsuariosController {
    async adicionar(req: Request, res: Response) {
        const { nome, idade, email, senha, tipo = 'comum' } = req.body;

        if (!nome || !idade || !email || !senha)
            return res.status(400).json({ error: "Nome, idade, email e senha são obrigatórios" });

        if (senha.length < 6)
            return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });

        if (!email.includes('@') || !email.includes('.'))
            return res.status(400).json({ error: "Email inválido" });

        if (tipo !== 'admin' && tipo !== 'comum')
            return res.status(400).json({ error: "Tipo de usuário inválido. Use 'admin' ou 'comum'" });

        const senhaCriptografada = await bcrypt.hash(senha, 10);
        const usuario = { nome, idade, email, senha: senhaCriptografada, tipo };

        const resultado = await db.collection('usuarios').insertOne(usuario);
        res.status(201).json({ nome, idade, email, tipo, _id: resultado.insertedId });
    }

    async listar(req: Request, res: Response) {
        const usuarios = await db.collection('usuarios').find().toArray();
        res.status(200).json(usuarios);
    }

    async login(req: Request, res: Response) {
        const { email, senha } = req.body;

        if (!email || !senha)
            return res.status(400).json({ mensagem: "Email e senha são obrigatórios!" });

        const usuario = await db.collection('usuarios').findOne({ email });

        if (!usuario)
            return res.status(401).json({ mensagem: "Usuário incorreto!" });

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida)
            return res.status(401).json({ mensagem: "Senha incorreta!" });

       
        const tipo = usuario.tipo || 'comum';

      
        const token = jwt.sign(
            {
                usuarioId: usuario._id,
                tipo: tipo
            },
            process.env.JWT_SECRET!,
            { expiresIn: '1h' } 
        );

        res.status(200).json({
            token: token,
            tipo: tipo,
            nome: usuario.nome
        });
    }
    async logout(req: Request, res: Response) {
        res.status(200).json({ mensagem: "Logout realizado com sucesso!" });
    }
}

export default new UsuariosController()
