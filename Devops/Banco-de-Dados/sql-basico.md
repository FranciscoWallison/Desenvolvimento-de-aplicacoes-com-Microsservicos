````
CREATE TABLE Usuarios (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Nome TEXT NOT NULL,
    Email TEXT NOT NULL UNIQUE,
    DataDeCadastro DATE DEFAULT CURRENT_DATE
);
````

````
.schema Usuarios
````

````
INSERT INTO Usuarios (Nome, Email) VALUES ('Francisco Wallison', 'franciscowallison@gmail.com');
````

````
SELECT * FROM Usuarios;
````

---

> 📎 **Próximo passo:** [buscas-inteligentes.md](buscas-inteligentes.md) — por que `WHERE Nome LIKE '%ana%'` quebra em produção, e o que usar no lugar (Full-Text Search, trigram, busca fuzzy).

