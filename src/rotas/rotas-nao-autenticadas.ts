import {Router} from 'express'

import produtosController from '../produtos/produtos.controller.js'
import usuariosController from '../usuarios/usuarios.controller.js'
import carrinhoController from '../carrinho/carrinho.controller.js'

const rotas = Router()



rotas.post('/adicionarusuario',usuariosController.adicionar)
rotas.post('/login',usuariosController.login)



export default rotas