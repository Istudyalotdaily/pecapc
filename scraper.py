import requests
from bs4 import BeautifulSoup

def get_amazon_price(query):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }
    url = f"https://www.amazon.com.br/s?k={query.replace(' ', '+')}"
    
    try:
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.content, "html.parser")
        price_whole = soup.find("span", {"class": "a-price-whole"}).text
        price_fraction = soup.find("span", {"class": "a-price-fraction"}).text
        return f"R$ {price_whole}{price_fraction}"
    except Exception:
        return "Preço não encontrado"

item = "Ryzen 5 5600"
print(f"Buscando {item} na Amazon: {get_amazon_price(item)}")
