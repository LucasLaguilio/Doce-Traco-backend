import { Request, Response } from 'express'
import { db } from '../database/banco-mongo.js'
import { ObjectId } from 'mongodb'

class ProdutoController {
  async adicionar(req: Request, res: Response) {
    const { nome, preco, urlfoto, descricao } = req.body
    if (!nome || !preco || !urlfoto || !descricao) {
      return res.status(400).json({ error: 'Nome, preço, urlfoto e descrição são obrigatórios' })
    }

    const produto = { nome, preco, urlfoto, descricao }
    const result = await db.collection('produtos').insertOne(produto)
    res.status(201).json({ nome, preco, urlfoto, descricao, _id: result.insertedId })
  }

  async listar(_req: Request, res: Response) {
    const produtos = await db.collection('produtos').find().toArray()
    res.status(200).json(produtos)
  }

  async editar(req: Request, res: Response) {
    const { id } = req.params
    const { nome, preco, urlfoto, descricao } = req.body

    if (!nome || !preco || !urlfoto || !descricao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios para edição.' })
    }

    try {
      const objectId = new ObjectId(id)
      const result = await db.collection('produtos').updateOne(
        { _id: objectId },
        { $set: { nome, preco, urlfoto, descricao } }
      )

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Produto não encontrado.' })
      }

      res.status(200).json({ _id: objectId, nome, preco, urlfoto, descricao })
    } catch (error) {
      return res.status(400).json({ error: 'ID de produto inválido.' })
    }
  }


  async excluir(req: Request, res: Response) {
    try {
      const { id } = req.params
      const objectId = new ObjectId(id)

      const result = await db.collection('produtos').deleteOne({ _id: objectId })

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Produto não encontrado.' })
      }

      res.status(200).json({ message: 'Produto excluído com sucesso!' })
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      res.status(400).json({ error: 'ID de produto inválido.' })
    }
  }
}

export default new ProdutoController()