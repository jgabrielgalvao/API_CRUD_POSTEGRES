const express = require("express");
const { pool } = require("./data/data");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());


app.listen(8080, () => {
    console.log("O servidor está de pé na porta 8080")
});

app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    const client = await pool.connect();

    const encontraUser = await client.query(`SELECT * FROM usuarios WHERE email = ' ${ email } '`);
    if (!encontraUser) {
        return res.status(401).json({ error: 'usuário não encontrado' });
    }

    if (parseInt(encontraUser.rows[0].senha) !== senha) {
        return res.status(401).json({ error: 'Senha incorreta.' });
    }

    const { id, nome } = encontraUser.rows[0]
    return res.status(200).json({
        user: {
            id,
            nome,
            email,
        },
        token: jwt.sign({ id }, process.env.SECRET_JWT, {
            expiresIn: process.env.EXPIRESIN_JWT,
        }),
    });
})

app.get("/users", async (req, res) => {
    try {
        const client = await pool.connect();
        const { rows } = await client.query("SELECT * FROM usuarios");
        console.table(rows);
        res.status(200).send(rows);
    } catch (error) {
        console.error(error);
    }
});

app.post("/users", async (req, res) => {

    try {
        const { id, nome, email, senha } = req.body
        const client = await pool.connect();

        if (!id || !nome || !email || !senha) {
            return res.status(401).send("Informe o nome, email e senha.")
        }

        const user = await client.query(`SELECT * FROM usuarios where id=${id}`);
        if (user.rows.length === 0) {
            await client.query(`INSERT INTO usuarios(id, nome, email, senha) values ('${id}', '${nome}', '${email}', '${senha}')`)
            res.status(200).send({
                msg: "Usuário cadastrado com sucesso",
            });
        } else {
            res.status(401).send("Usuário já existe");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro de conexão com o servidor");
    }
})

app.put("/users/:id", async (req, res) => {

    try {
        const { id } = req.params;
        const { nome, email, senha } = req.body;

        const client = await pool.connect();
        if (!id || !nome) {
            return res.status(401).send("Id não informados.")
        }

        const user = await client.query(`SELECT * FROM usuarios where id=${id}`);
        if (user.rows.length > 0) {
            await client.query(`UPDATE usuarios SET nome = '${nome}',email ='${email}',senha ='${senha}' WHERE id=${id}`);
            res.status(200).send({ msg: "Atualização feita com sucesso"});
        } else {
            res.status(401).send("Usuário não encontrado.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro de conexão com o servidor");
    }
})

app.delete("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (id === undefined) {
            return res.status(401).send("Usuario não informado.")
        }

        const client = await pool.connect();
        const del = await client.query(`DELETE FROM usuarios where id=${id}`)

        if (del.rowCount == 1) {
            return res.status(200).send("Usuario deletado com sucesso.");
        } else {
            return res.status(200).send("Usuario não encontrado.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro de conexão com o servidor");
    }
})
