import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from "express";


interface AutenticacaoRequest extends Request {
    usuarioId?: string;
    tipo?: string; 
}

interface JwtPayload {
    usuarioId: string;
    tipo: string; 
}

function Auth(req: AutenticacaoRequest, res: Response, next: NextFunction) {
    console.log("Cheguei no middleware de Autenticação")
    const authHeaders = req.headers.authorization
    console.log(authHeaders)

    if (!authHeaders)
        return res.status(401).json({ mensagem: "Você não passou o token no Bearer" })

    // Verifica se o formato é "Bearer <token>"
    if (!authHeaders.startsWith("Bearer "))
        return res.status(401).json({ mensagem: "Formato do token inválido (esperado: Bearer <token>)" })

    const token = authHeaders.split(" ")[1]!

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return res.status(500).json({ mensagem: "JWT_SECRET não definido no ambiente" });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).json({ mensagem: "Middleware erro token" })
        }

        
        if (typeof decoded === "string" || !decoded || !("usuarioId" in decoded) || !("tipo" in decoded)) {
            return res.status(401).json({ mensagem: "Middleware erro decoded: campos 'usuarioId' ou 'tipo' ausentes." })
        }

        const payload = decoded as JwtPayload;

        req.usuarioId = payload.usuarioId
        req.tipo = payload.tipo // **IMPORTANTE: Atribui o tipo à requisição**
        next()
    })
}

export default  Auth;
export type { AutenticacaoRequest }; 