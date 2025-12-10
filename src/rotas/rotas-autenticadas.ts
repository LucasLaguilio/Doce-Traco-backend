import { Router } from 'express'
import carrinhoController from '../carrinho/carrinho.controller.js'
import produtosController from '../produtos/produtos.controller.js'
import Auth from '../middlewares/auth.js' 
import AuthAdmin from "../middlewares/authadmin.js" 
import usuariosController from '../usuarios/usuarios.controller.js'

const rotas = Router()


rotas.post('/produtos', Auth, AuthAdmin, produtosController.adicionar)
rotas.get('/produtos', produtosController.listar)
rotas.put('/produtos/:id', Auth, AuthAdmin, produtosController.editar)
rotas.delete('/produtos/:id', Auth, AuthAdmin, produtosController.deletar)
rotas.post('/adicionarItem', Auth, carrinhoController.adicionarItem)
rotas.post('/removerunidadeItem', Auth, carrinhoController.removerunidadeItem)
rotas.get('/carrinho', Auth, carrinhoController.listar)
rotas.delete('/carrinho', Auth, carrinhoController.remover)
rotas.post("/removerItem", carrinhoController.removerItem);
rotas.get("/carrinho/:usuarioId", carrinhoController.listar);
rotas.delete("/carrinho/:usuarioId", carrinhoController.remover);
rotas.post('/criar-pagamento-cartao', Auth, carrinhoController.criarPagamento);


rotas.delete("/produtos/excluir/:id", Auth, AuthAdmin, produtosController.excluir)

rotas.get("/usuarios", Auth, AuthAdmin, usuariosController.listar)
rotas.post("/logout", Auth, usuariosController.logout) 


export default rotas