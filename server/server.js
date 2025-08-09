const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do banco SQL Server
const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'GADYS_DB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'sua_senha',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Conectar ao banco
sql.connect(config).then(() => {
    console.log('✅ Conectado ao SQL Server');
}).catch(err => {
    console.error('❌ Erro ao conectar:', err);
});

// =============================================
// ROTAS DE USUÁRIOS
// =============================================

// Listar usuários
app.get('/api/usuarios', async (req, res) => {
    try {
        const result = await sql.query`
            SELECT ID, Nome, Email, TipoUsuario, UltimoAcesso, TotalAcessos, IPAcesso, DataCadastro 
            FROM Usuarios ORDER BY DataCadastro DESC
        `;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Adicionar usuário
app.post('/api/usuarios', async (req, res) => {
    try {
        const { nome, email, senha, tipoUsuario } = req.body;
        
        const result = await sql.query`
            INSERT INTO Usuarios (Nome, Email, Senha, TipoUsuario) 
            VALUES (${nome}, ${email}, ${senha}, ${tipoUsuario})
        `;
        
        res.json({ success: true, message: 'Usuário cadastrado com sucesso!' });
    } catch (err) {
        if (err.number === 2627) { // Duplicate key error
            res.status(400).json({ error: 'Email já cadastrado!' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Registrar acesso de usuário
app.post('/api/usuarios/acesso', async (req, res) => {
    try {
        const { nome, tipoUsuario } = req.body;
        
        await sql.query`
            UPDATE Usuarios 
            SET UltimoAcesso = GETDATE(), TotalAcessos = TotalAcessos + 1
            WHERE Nome = ${nome} AND TipoUsuario = ${tipoUsuario}
        `;
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha, tipoUsuario } = req.body;
        
        const result = await sql.query`
            SELECT ID, Nome, Email, TipoUsuario 
            FROM Usuarios 
            WHERE Email = ${email} AND Senha = ${senha} AND TipoUsuario = ${tipoUsuario}
        `;
        
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            
            // Atualizar último acesso
            await sql.query`
                UPDATE Usuarios 
                SET UltimoAcesso = GETDATE(), TotalAcessos = TotalAcessos + 1 
                WHERE ID = ${user.ID}
            `;
            
            res.json({ success: true, user });
        } else {
            res.status(401).json({ error: 'Credenciais inválidas!' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =============================================
// ROTAS DE LOCAIS
// =============================================

// Listar locais
app.get('/api/locais', async (req, res) => {
    try {
        const result = await sql.query`
            SELECT * FROM vw_LocaisCompletos 
            WHERE Status = 'ativo' 
            ORDER BY Nome
        `;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Listar locais por categoria
app.get('/api/locais/categoria/:categoria', async (req, res) => {
    try {
        const { categoria } = req.params;
        const result = await sql.query`
            SELECT l.*, c.Nome as Categoria, cid.Nome as Cidade, e.Sigla as EstadoSigla
            FROM Locais l
            JOIN Categorias c ON l.CategoriaID = c.ID
            JOIN Cidades cid ON l.CidadeID = cid.ID
            JOIN Estados e ON cid.EstadoID = e.ID
            WHERE c.Nome = ${categoria} AND l.Status = 'ativo'
            ORDER BY l.Nome
        `;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Adicionar local
app.post('/api/locais', async (req, res) => {
    try {
        const { nome, descricao, cidadeId, categoriaId, criadoPor } = req.body;
        
        const result = await sql.query`
            INSERT INTO Locais (Nome, Descricao, CidadeID, CategoriaID, CriadoPor) 
            VALUES (${nome}, ${descricao}, ${cidadeId}, ${categoriaId}, ${criadoPor})
        `;
        
        res.json({ success: true, message: 'Local cadastrado com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Listar locais pendentes
app.get('/api/locais/pendentes', async (req, res) => {
    try {
        const result = await sql.query`
            SELECT * FROM LocaisPendentes 
            WHERE Status = 'pendente'
            ORDER BY DataEnvio DESC
        `;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Listar locais aprovados
app.get('/api/locais/aprovados', async (req, res) => {
    try {
        const result = await sql.query`
            SELECT * FROM LocaisPendentes 
            WHERE Status = 'aprovado'
            ORDER BY DataEnvio DESC
        `;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Aprovar local pendente
app.post('/api/locais/aprovar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await sql.query`
            UPDATE LocaisPendentes 
            SET Status = 'aprovado'
            WHERE ID = ${id}
        `;
        
        res.json({ success: true, message: 'Local aprovado com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rejeitar local pendente
app.post('/api/locais/rejeitar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await sql.query`
            UPDATE LocaisPendentes 
            SET Status = 'rejeitado'
            WHERE ID = ${id}
        `;
        
        res.json({ success: true, message: 'Local rejeitado!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Excluir local (mover para lixeira)
app.post('/api/locais/excluir/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await sql.query`
            UPDATE Locais 
            SET Status = 'inativo'
            WHERE ID = ${id}
        `;
        
        res.json({ success: true, message: 'Local movido para lixeira!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Restaurar local da lixeira
app.post('/api/locais/restaurar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await sql.query`
            UPDATE Locais 
            SET Status = 'ativo'
            WHERE ID = ${id}
        `;
        
        res.json({ success: true, message: 'Local restaurado!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Listar locais da lixeira
app.get('/api/locais/lixeira', async (req, res) => {
    try {
        const result = await sql.query`
            SELECT * FROM vw_LocaisCompletos 
            WHERE Status = 'inativo'
            ORDER BY DataCriacao DESC
        `;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Excluir usuário
app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await sql.query`
            DELETE FROM Usuarios WHERE ID = ${id}
        `;
        
        res.json({ success: true, message: 'Usuário excluído!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =============================================
// ROTAS DE AVALIAÇÕES
// =============================================

// Adicionar avaliação
app.post('/api/avaliacoes', async (req, res) => {
    try {
        const { localId, usuarioId, nota } = req.body;
        
        const result = await sql.query`
            INSERT INTO Avaliacoes (LocalID, UsuarioID, Nota) 
            VALUES (${localId}, ${usuarioId}, ${nota})
        `;
        
        res.json({ success: true, message: 'Avaliação registrada!' });
    } catch (err) {
        if (err.number === 2627) { // Duplicate key error
            res.status(400).json({ error: 'Você já avaliou este local!' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// =============================================
// ROTAS DE COMENTÁRIOS
// =============================================

// Listar comentários de um local
app.get('/api/comentarios/:localId', async (req, res) => {
    try {
        const { localId } = req.params;
        
        const result = await sql.query`
            SELECT c.Texto, c.DataComentario, u.Nome as Usuario
            FROM Comentarios c
            JOIN Usuarios u ON c.UsuarioID = u.ID
            WHERE c.LocalID = ${localId}
            ORDER BY c.DataComentario DESC
        `;
        
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Listar todos os comentários agrupados por local
app.get('/api/comentarios/all', async (req, res) => {
    try {
        const result = await sql.query`
            SELECT 
                l.Nome as LocalNome,
                c.Texto,
                c.DataComentario,
                u.Nome as Usuario
            FROM Comentarios c
            JOIN Usuarios u ON c.UsuarioID = u.ID
            JOIN Locais l ON c.LocalID = l.ID
            ORDER BY l.Nome, c.DataComentario DESC
        `;
        
        // Agrupar comentários por local
        const commentsByLocal = {};
        result.recordset.forEach(comment => {
            if (!commentsByLocal[comment.LocalNome]) {
                commentsByLocal[comment.LocalNome] = [];
            }
            commentsByLocal[comment.LocalNome].push({
                userName: comment.Usuario,
                text: comment.Texto,
                date: comment.DataComentario
            });
        });
        
        res.json(commentsByLocal);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Adicionar comentário
app.post('/api/comentarios', async (req, res) => {
    try {
        const { localId, usuarioId, texto } = req.body;
        
        const result = await sql.query`
            INSERT INTO Comentarios (LocalID, UsuarioID, Texto) 
            VALUES (${localId}, ${usuarioId}, ${texto})
        `;
        
        res.json({ success: true, message: 'Comentário adicionado!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =============================================
// ROTAS DE RANKING
// =============================================

// Ranking de locais
app.get('/api/ranking', async (req, res) => {
    try {
        const result = await sql.query`
            SELECT TOP 20 * FROM vw_RankingLocais 
            ORDER BY MediaAvaliacoes DESC, TotalAvaliacoes DESC
        `;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =============================================
// ROTA DE ESTATÍSTICAS
// =============================================

app.get('/api/estatisticas', async (req, res) => {
    try {
        const result = await sql.query`EXEC sp_EstatisticasSistema`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 API disponível em http://localhost:${PORT}`);
});

module.exports = app;