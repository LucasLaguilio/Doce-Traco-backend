import { Response, NextFunction } from "express";
import { AutenticacaoRequest } from "./auth.js"; 

function AuthAdmin(req: AutenticacaoRequest, res: Response, next: NextFunction) {
    console.log("Cheguei no middleware de Autorização Admin")

    
    if (req.tipo !== 'admin') {
        return res.status(403).json({ mensagem: "Acesso negado. Apenas administradores podem executar esta ação." });
    }

    next();
}

export default AuthAdmin;