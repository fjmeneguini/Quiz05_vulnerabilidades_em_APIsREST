# Quiz 5 Web3

Projeto da disciplina Web3 sobre vulnerabilidades em APIs REST.

## Como executar

1. Instale as dependencias na raiz e em cada servico:
   - `npm install`
   - em `auth-service`, `product-service` e `gateway`: `npm install`
2. Copie cada `.env.example` para `.env` e ajuste os valores.
3. Crie os bancos `auth_db` e `product_db` no MySQL.
4. Rode na raiz: `npm start`

## Estrutura

- `auth-service`: autenticacao
- `product-service`: produtos
- `gateway`: roteamento
- `descricao`: materiais da atividade
