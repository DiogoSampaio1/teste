# Aplicação de Organização e Alocação de Produtos no NIT

## Introdução

Esta aplicação foi desenvolvida com o objetivo de organizar e alocar produtos de menor dimensão dentro do NIT. Foi pensada para facilitar a organização e o controlo de produtos.

## Objetivo

O objetivo principal é permitir que Utilizadores específicos tenham a capacidade de organizar e alocar diversos produtos de forma simples, porém eficaz.

## Funcionalidades

O site tem como principal funcionalidade a leitura de QRCodes e Códigos de Barras. O site conta com diferentes tipos de categorias para facilitar a navegação do utilizador, sendo elas:

- **Produtos:** Página principal responsável por conter todos os produtos, identificando o Código, Nome, Classe, Localização, Quantidade e as ações possíveis. Sendo as ações editar e excluir o produto. Ao clicar no botão de editar será possível fazer as mudanças no Nome, Classe, Localização e a Quantidade do produto.

- **Classes:** Responsável pela criação de classe também sendo possível editar e excluí-las. É possível alterar somente o Nome das classes.

- **Localização:** Tal como as classes, a página de Localização é utilizada para criar o local em que o produto será colocado.

- **Utilizadores:** É possível criar utilizadores para terem acessos restritos com a escolha de criar um utilizador com ou sem password.

- **Scan:** Sendo a página que será possível scanear os Códigos de Barra e os QRCodes, também sendo possível criar o produto manualmente, sem a necessidade de utilizar o celular para scanear um novo produto.

- **Login:** Utilizará o utilizador criado para fazer login.

## Tecnologias Utilizadas

- **Frontend:** HTML, CSS e JS  
- **Backend:** Python, Flask  
- **Base de Dados:** Mysql  
- **Autenticação:** JWT  
- **API:** SwaggerAPI  

## Como correr?

1. Instalar dependências necessárias:

    ```bash
    sudo apt install python3-full python3-dev python3-venv default-libmysqlclient-dev build-essential pkg-config
    ```

2. Deploy na base de dados de teste  
   Mais informação em: https://dev.mysql.com/doc/

3. Criar um ambiente virtual de python no backend:

    ```bash
    cd teste/backend
    python3 -m venv venv
    source venv/bin/activate
    pip3 install -r requirements.txt
    ```

4. Lembra-te de mudar o engine connection no backend para a tua password e username do MySql.

5. Muda também no ficheiro `Frontend/src/script/mainScript.js` a const `URL` para `http://127.0.0.1:5000/`

6. Executar o servidor:

    ```bash
    python3 app.py
    ```

7. Entrar em [http://127.0.0.1:5000/](http://127.0.0.1:5000/) ou [http://127.0.0.1:5000/apidocs](http://127.0.0.1:5000/apidocs) para aceder à API do site.

## Possíveis Melhorias

- Processo de scan múltiplo para o PC  
- SearchBar com mais opções  
- Colocar itens máximo por páginas  

> **PS:** Para a câmara no telemóvel funcionar é necessário colocar https.
