#!/usr/bin/env python3
import sys
import json
import cloudscraper
from bs4 import BeautifulSoup

def scrape_sofifa_players(url: str) -> dict:
    """
    Extrai jogadores de uma URL específica do SoFIFA.
    """
    try:
        scraper = cloudscraper.create_scraper()
        response = scraper.get(url, timeout=10)
        
        if response.status_code != 200:
            return {
                "success": False,
                "error": f"HTTP {response.status_code}: Falha ao acessar a URL",
                "players": []
            }
        
        soup = BeautifulSoup(response.text, 'html.parser')
        table_body = soup.find('tbody')
        
        if not table_body:
            return {
                "success": False,
                "error": "Tabela não encontrada. Verifique se a URL do SoFIFA está correta.",
                "players": []
            }
        
        players_data = []
        rows = table_body.find_all('tr')
        
        for row in rows:
            cells = row.find_all('td')
            if len(cells) < 6:
                continue
            
            try:
                # Nome e Posições
                name_cell = cells[1]
                name_tag = name_cell.find('a')
                if not name_tag:
                    continue
                
                name = name_tag.text.strip()
                
                # Posições (tags curtas como CB, ST)
                positions = []
                for link in name_cell.find_all('a', rel='nofollow'):
                    text = link.text.strip()
                    if len(text) > 0 and len(text) <= 3 and text.isupper():
                        positions.append(text)
                
                # Idade
                age_text = cells[2].text.strip()
                age = int(age_text) if age_text.isdigit() else age_text
                
                # Overall
                overall_text = cells[3].text.strip()
                overall = int(overall_text) if overall_text.isdigit() else overall_text
                
                # Potencial
                potential_text = cells[4].text.strip()
                potential = int(potential_text) if potential_text.isdigit() else potential_text
                
                # Time (Club)
                team_cell = cells[5]
                team_tag = team_cell.find('a')
                team = team_tag.text.strip() if team_tag else "Free Agent"
                
                player = {
                    "nome": name,
                    "idade": age,
                    "overall": overall,
                    "potencial": potential,
                    "time": team,
                    "posicoes": positions
                }
                players_data.append(player)
            except Exception as e:
                # Continua mesmo se uma linha falhar
                continue
        
        if not players_data:
            return {
                "success": False,
                "error": "Nenhum jogador encontrado na página.",
                "players": []
            }
        
        return {
            "success": True,
            "error": None,
            "players": players_data,
            "count": len(players_data)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": f"Erro durante a extração: {str(e)}",
            "players": []
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "URL não fornecida",
            "players": []
        }))
        sys.exit(1)
    
    url = sys.argv[1]
    result = scrape_sofifa_players(url)
    print(json.dumps(result, ensure_ascii=False, indent=2))
