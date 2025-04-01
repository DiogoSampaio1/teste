import requests

# URL da API (substitua pela correta)
url = "https://api.example.com/cartao-cidadao"

# Dados do Cartão de Cidadão (exemplo)
dados = {
    "nome": "João Silva",
    "numero": "123456789",
    "data_nascimento": "1990-05-15",
    "nif": "123456789",
    "morada": "Rua das Flores, 123"
}

# Cabeçalhos (se a API precisar de autenticação)
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer SEU_TOKEN_AQUI"
}

# Enviar a requisição
response = requests.post(url, json=dados, headers=headers)

# Verificar resposta
if response.status_code == 201:
    print("✅ Dados inseridos com sucesso!")
else:
    print(f"❌ Erro: {response.status_code} - {response.text}")
