import axios from 'axios';
import { load } from 'cheerio';
import { Readable } from 'stream';
import path from 'path';
import puppeteer from 'puppeteer';

// Mapeamento de posicoes do ingles para portugues abreviado conforme padroes do site
const POSITION_TRANSLATIONS: Record<string, string> = {
  // Posições principais (conforme tabela do usuário)
  'GK': 'GOL',
  'RB': 'LD',
  'CB': 'ZAG',
  'LB': 'LE',
  'CDM': 'VOL',
  'CM': 'MC',
  'CAM': 'MEI',
  'RM': 'MD',
  'RW': 'PD',
  'LM': 'ME',
  'LW': 'PE',
  'ST': 'ATA',
  
  // Variações e posições adicionais (mapeadas para equivalentes)
  'CF': 'ATA',      // Center Forward → Atacante
  'LWB': 'LE',      // Left Wing Back → Lateral Esquerdo
  'RWB': 'LD',      // Right Wing Back → Lateral Direito
  'LCM': 'MC',      // Left Center Mid → Meio Campo
  'RCM': 'MC',      // Right Center Mid → Meio Campo
  'LDM': 'VOL',     // Left Defensive Mid → Volante
  'RDM': 'VOL',     // Right Defensive Mid → Volante
  'LAM': 'MEI',     // Left Attacking Mid → Meia
  'RAM': 'MEI',     // Right Attacking Mid → Meia
  'LF': 'PE',       // Left Forward → Ponta Esquerda
  'RF': 'PD',       // Right Forward → Ponta Direita
  'AT': 'ATA',      // Attacker → Atacante
};

function translatePosition(position: string): string {
  return POSITION_TRANSLATIONS[position] || position;
}

// Função para extrair apenas o valor numérico de overall/potencial (remove +/- e sufixos)
function extractNumericValue(value: string): number | string {
  if (!value) return value;
  // Remove tudo após o primeiro hífen ou mais (ex: "78-1" → "78", "83+2" → "83")
  const match = value.match(/^(\d+)/);
  if (match) {
    return Number(match[1]);
  }
  return isNaN(Number(value)) ? value : Number(value);
}

// Mapeamento de países do inglês para português
const COUNTRY_TRANSLATIONS: Record<string, string> = {
  'Afghanistan': 'Afeganistão',
  'Albania': 'Albânia',
  'Algeria': 'Argélia',
  'Andorra': 'Andorra',
  'Angola': 'Angola',
  'Antigua and Barbuda': 'Antígua e Barbuda',
  'Argentina': 'Argentina',
  'Armenia': 'Armênia',
  'Australia': 'Austrália',
  'Austria': 'Áustria',
  'Azerbaijan': 'Azerbaijão',
  'Bahamas': 'Bahamas',
  'Bahrain': 'Bahrein',
  'Bangladesh': 'Bangladesh',
  'Barbados': 'Barbados',
  'Belarus': 'Bielorrússia',
  'Belgium': 'Bélgica',
  'Belize': 'Belize',
  'Benin': 'Benin',
  'Bermuda': 'Bermudas',
  'Bhutan': 'Butão',
  'Bolivia': 'Bolívia',
  'Bosnia and Herzegovina': 'Bósnia e Herzegovina',
  'Botswana': 'Botsuana',
  'Brazil': 'Brasil',
  'Brunei': 'Brunei',
  'Bulgaria': 'Bulgária',
  'Burkina Faso': 'Burkina Faso',
  'Burundi': 'Burundi',
  'Cambodia': 'Camboja',
  'Cameroon': 'Camarões',
  'Canada': 'Canadá',
  'Cape Verde': 'Cabo Verde',
  'Central African Republic': 'República Centro-Africana',
  'Chad': 'Chade',
  'Chile': 'Chile',
  'China': 'China',
  'Colombia': 'Colômbia',
  'Comoros': 'Comores',
  'Congo': 'Congo',
  'Costa Rica': 'Costa Rica',
  'Croatia': 'Croácia',
  'Cuba': 'Cuba',
  'Cyprus': 'Chipre',
  'Czech Republic': 'República Tcheca',
  'Czechia': 'República Tcheca',
  'Denmark': 'Dinamarca',
  'Djibouti': 'Djibuti',
  'Dominica': 'Dominica',
  'Dominican Republic': 'República Dominicana',
  'Ecuador': 'Equador',
  'Egypt': 'Egito',
  'El Salvador': 'El Salvador',
  'England': 'Inglaterra',
  'Equatorial Guinea': 'Guiné Equatorial',
  'Eritrea': 'Eritreia',
  'Estonia': 'Estônia',
  'Ethiopia': 'Etiópia',
  'Fiji': 'Fiji',
  'Finland': 'Finlândia',
  'France': 'França',
  'Gabon': 'Gabão',
  'Gambia': 'Gâmbia',
  'Georgia': 'Geórgia',
  'Germany': 'Alemanha',
  'Ghana': 'Gana',
  'Greece': 'Grécia',
  'Grenada': 'Granada',
  'Guatemala': 'Guatemala',
  'Guinea': 'Guiné',
  'Guinea-Bissau': 'Guiné-Bissau',
  'Guyana': 'Guiana',
  'Haiti': 'Haiti',
  'Honduras': 'Honduras',
  'Hong Kong': 'Hong Kong',
  'Hungary': 'Hungria',
  'Iceland': 'Islândia',
  'India': 'Índia',
  'Indonesia': 'Indonésia',
  'Iran': 'Irã',
  'Iraq': 'Iraque',
  'Ireland': 'Irlanda',
  'Israel': 'Israel',
  'Italy': 'Itália',
  'Ivory Coast': 'Costa do Marfim',
  'Jamaica': 'Jamaica',
  'Japan': 'Japão',
  'Jordan': 'Jordânia',
  'Kazakhstan': 'Cazaquistão',
  'Kenya': 'Quênia',
  'Korea': 'Coreia',
  'North Korea': 'Coreia do Norte',
  'South Korea': 'Coreia do Sul',
  'Kosovo': 'Kosovo',
  'Kuwait': 'Kuwait',
  'Kyrgyzstan': 'Quirguistão',
  'Laos': 'Laos',
  'Latvia': 'Letônia',
  'Lebanon': 'Líbano',
  'Lesotho': 'Lesoto',
  'Liberia': 'Libéria',
  'Libya': 'Líbia',
  'Liechtenstein': 'Liechtenstein',
  'Lithuania': 'Lituânia',
  'Luxembourg': 'Luxemburgo',
  'Macao': 'Macau',
  'Madagascar': 'Madagáscar',
  'Malawi': 'Malawi',
  'Malaysia': 'Malásia',
  'Maldives': 'Maldivas',
  'Mali': 'Mali',
  'Malta': 'Malta',
  'Mauritania': 'Mauritânia',
  'Mauritius': 'Maurício',
  'Mexico': 'México',
  'Moldova': 'Moldávia',
  'Monaco': 'Mônaco',
  'Mongolia': 'Mongólia',
  'Montenegro': 'Montenegro',
  'Morocco': 'Marrocos',
  'Mozambique': 'Moçambique',
  'Myanmar': 'Mianmar',
  'Namibia': 'Namíbia',
  'Nepal': 'Nepal',
  'Netherlands': 'Países Baixos',
  'New Zealand': 'Nova Zelândia',
  'Nicaragua': 'Nicarágua',
  'Niger': 'Níger',
  'Nigeria': 'Nigéria',
  'Northern Ireland': 'Irlanda do Norte',
  'Norway': 'Noruega',
  'Oman': 'Omã',
  'Pakistan': 'Paquistão',
  'Palestine': 'Palestina',
  'Panama': 'Panamá',
  'Papua New Guinea': 'Papua-Nova Guiné',
  'Paraguay': 'Paraguai',
  'Peru': 'Peru',
  'Philippines': 'Filipinas',
  'Poland': 'Polônia',
  'Portugal': 'Portugal',
  'Qatar': 'Catar',
  'Romania': 'Romênia',
  'Russia': 'Rússia',
  'Rwanda': 'Ruanda',
  'Saint Kitts and Nevis': 'São Cristóvão e Névis',
  'Saint Lucia': 'Santa Lúcia',
  'Saint Vincent and the Grenadines': 'São Vicente e Granadinas',
  'Samoa': 'Samoa',
  'San Marino': 'San Marino',
  'Sao Tome and Principe': 'São Tomé e Príncipe',
  'Saudi Arabia': 'Arábia Saudita',
  'Scotland': 'Escócia',
  'Senegal': 'Senegal',
  'Serbia': 'Sérvia',
  'Seychelles': 'Seicheles',
  'Sierra Leone': 'Serra Leoa',
  'Singapore': 'Singapura',
  'Slovakia': 'Eslováquia',
  'Slovenia': 'Eslovênia',
  'Solomon Islands': 'Ilhas Salomão',
  'Somalia': 'Somália',
  'South Africa': 'África do Sul',
  'South Sudan': 'Sudão do Sul',
  'Spain': 'Espanha',
  'Sri Lanka': 'Sri Lanka',
  'Sudan': 'Sudão',
  'Suriname': 'Suriname',
  'Sweden': 'Suécia',
  'Switzerland': 'Suíça',
  'Syria': 'Síria',
  'Taiwan': 'Taiwan',
  'Tajikistan': 'Tajiquistão',
  'Tanzania': 'Tanzânia',
  'Thailand': 'Tailândia',
  'Timor-Leste': 'Timor-Leste',
  'Togo': 'Togo',
  'Tonga': 'Tonga',
  'Trinidad and Tobago': 'Trinidad e Tobago',
  'Tunisia': 'Tunísia',
  'Turkey': 'Turquia',
  'Turkmenistan': 'Turcomenistão',
  'Uganda': 'Uganda',
  'Ukraine': 'Ucrânia',
  'United Arab Emirates': 'Emirados Árabes Unidos',
  'United Kingdom': 'Reino Unido',
  'United States': 'Estados Unidos',
  'Uruguay': 'Uruguai',
  'Uzbekistan': 'Uzbequistão',
  'Vanuatu': 'Vanuatu',
  'Venezuela': 'Venezuela',
  'Vietnam': 'Vietnã',
  'Wales': 'País de Gales',
  'Yemen': 'Iêmen',
  'Zambia': 'Zâmbia',
  'Zimbabwe': 'Zimbábue',
  
  // Espanhol
  'Afganistán': 'Afeganistão', 'Argelia': 'Argélia', 'Antigua y Barbuda': 'Antígua e Barbuda', 'Armenia': 'Armênia',
  'Azerbaiyán': 'Azerbaijão', 'Baréin': 'Bahrein', 'Bielorrusia': 'Bielorrússia', 'Belice': 'Belize',
  'Benín': 'Benin', 'Bermudas': 'Bermudas', 'Bután': 'Butão', 'Bolivia': 'Bolívia', 'Bosnia y Herzegovina': 'Bósnia e Herzegovina',
  'Bulgaria': 'Bulgária', 'Camerún': 'Camarões', 'Canadá': 'Canadá', 'Cabo Verde': 'Cabo Verde', 'República Centroafricana': 'República Centro-Africana',
  'Chile': 'Chile', 'China': 'China', 'Colombia': 'Colômbia', 'Comoras': 'Comores', 'Congo': 'Congo',
  'Costa Rica': 'Costa Rica', 'Croacia': 'Croácia', 'Cuba': 'Cuba', 'Chipre': 'Chipre', 'República Checa': 'República Tcheca',
  'Dinamarca': 'Dinamarca', 'Yibuti': 'Djibuti', 'Dominica': 'Dominica', 'República Dominicana': 'República Dominicana',
  'Ecuador': 'Equador', 'Egipto': 'Egito', 'El Salvador': 'El Salvador', 'Inglaterra': 'Inglaterra', 'Guinea Ecuatorial': 'Guiné Equatorial',
  'Eritrea': 'Eritreia', 'Estonia': 'Estônia', 'Etiopía': 'Etiópia', 'Fiji': 'Fiji', 'Finlandia': 'Finlândia',
  'Francia': 'França', 'Gabón': 'Gabão', 'Gambia': 'Gâmbia', 'Georgia': 'Geórgia', 'Alemania': 'Alemanha',
  'Ghana': 'Gana', 'Grecia': 'Grécia', 'Granada': 'Granada', 'Guatemala': 'Guatemala', 'Guinea': 'Guiné',
  'Guinea-Bisáu': 'Guiné-Bissau', 'Guyana': 'Guiana', 'Haití': 'Haiti', 'Honduras': 'Honduras', 'Hong Kong': 'Hong Kong',
  'Hungría': 'Hungria', 'Islandia': 'Islândia', 'India': 'Índia', 'Indonesia': 'Indonésia', 'Irán': 'Irã',
  'Irak': 'Iraque', 'Irlanda': 'Irlanda', 'Israel': 'Israel', 'Italia': 'Itália', 'Costa de Marfil': 'Costa do Marfim',
  'Jamaica': 'Jamaica', 'Japón': 'Japão', 'Jordania': 'Jordânia', 'Kazajistán': 'Cazaquistão', 'Kenia': 'Quênia',
  'Corea': 'Coreia', 'Corea del Norte': 'Coreia do Norte', 'Corea del Sur': 'Coreia do Sul', 'Kosovo': 'Kosovo',
  'Kuwait': 'Kuwait', 'Kirguistán': 'Quirguistão', 'Laos': 'Laos', 'Letonia': 'Letônia', 'Líbano': 'Líbano',
  'Lesoto': 'Lesoto', 'Liberia': 'Libéria', 'Libia': 'Líbia', 'Liechtenstein': 'Liechtenstein', 'Lituania': 'Lituânia',
  'Luxemburgo': 'Luxemburgo', 'Macao': 'Macau', 'Madagascar': 'Madagascar', 'Malaui': 'Malaui', 'Malasia': 'Malásia',
  'Maldivas': 'Maldivas', 'Mali': 'Mali', 'Malta': 'Malta', 'Mauritania': 'Mauritânia', 'Mauricio': 'Maurício',
  'México': 'México', 'Moldavia': 'Moldávia', 'Mónaco': 'Mônaco', 'Mongolia': 'Mongólia', 'Montenegro': 'Montenegro',
  'Marruecos': 'Marrocos', 'Mozambique': 'Moçambique', 'Myanmar': 'Mianmar', 'Namibia': 'Namíbia', 'Nepal': 'Nepal',
  'Paises Bajos': 'Holanda', 'Nueva Zelanda': 'Nova Zelândia', 'Nicaragua': 'Nicarágua', 'Níger': 'Níger',
  'Nigeria': 'Nigéria', 'Irlanda del Norte': 'Irlanda do Norte', 'Noruega': 'Noruega', 'Omán': 'Omã',
  'Pakistán': 'Paquistão', 'Palestina': 'Palestina', 'Panamá': 'Panamá', 'Papúa Nueva Guinea': 'Papua Nova Guiné',
  'Paraguay': 'Paraguai', 'Perú': 'Peru', 'Filipinas': 'Filipinas', 'Polonia': 'Polônia', 'Portugal': 'Portugal',
  'Catar': 'Catar', 'Rumania': 'Romênia', 'Rusia': 'Rússia', 'Ruanda': 'Ruanda', 'San Cristóbal y Nieves': 'São Cristóvão e Névis',
  'Santa Lucia': 'Santa Lúcia', 'San Vicente y las Granadinas': 'São Vicente e Granadinas', 'Samoa': 'Samoa',
  'San Marino': 'San Marino', 'Santo Tomé y Príncipe': 'São Tomé e Príncipe', 'Arabia Saudita': 'Arábia Saudita',
  'Escocia': 'Escócia', 'Senegal': 'Senegal', 'Serbia': 'Sérvia', 'Seychelles': 'Seicheles', 'Sierra Leona': 'Serra Leoa',
  'Singapur': 'Singapura', 'Eslovaquia': 'Eslováquia', 'Eslovenia': 'Eslovênia', 'Islas Salomón': 'Ilhas Salomão',
  'Somalia': 'Somália', 'Sudáfrica': 'África do Sul', 'Sudán del Sur': 'Sudão do Sul', 'España': 'Espanha',
  'Sri Lanka': 'Sri Lanka', 'Sudán': 'Sudão', 'Surinam': 'Surinã', 'Esuatini': 'Eswatíni', 'Suecia': 'Suécia',
  'Suiza': 'Suíça', 'Siria': 'Síria', 'Taiwán': 'Taiwan', 'Tayikistán': 'Tajiquistão', 'Tanzania': 'Tanzânia',
  'Tailandia': 'Tailândia', 'Timor Oriental': 'Timor-Leste', 'Togo': 'Togo', 'Tonga': 'Tonga',
  'Trinidad y Tobago': 'Trinidad e Tobago', 'Túnez': 'Tunísia', 'Turquía': 'Turquia', 'Turkmenistán': 'Turcomenistão',
  'Uganda': 'Uganda', 'Ucrania': 'Ucrânia', 'Emiratos Árabes Unidos': 'Emirados Árabes Unidos', 'Estados Unidos': 'Estados Unidos',
  'Uruguay': 'Uruguai', 'Uzbekistán': 'Uzbequistão', 'Vanuatu': 'Vanuatu', 'Venezuela': 'Venezuela', 'Vietnam': 'Vietnã',
  'Gales': 'País de Gales', 'Yemen': 'Iêmen', 'Zambia': 'Zâmbia', 'Zimbabue': 'Zimbábue',
  
  // Francês
  'Albanie': 'Albânia', 'Algérie': 'Argélia', 'Andorre': 'Andorra', 'Antigua-et-Barbuda': 'Antígua e Barbuda',
  'Argentine': 'Argentina', 'Arménie': 'Armênia', 'Australie': 'Austrália', 'Autriche': 'Áustria',
  'Azerbaïdjan': 'Azerbaijão', 'Bahamas': 'Bahamas', 'Bahreïn': 'Bahrein', 'Bangladesh': 'Bangladesh',
  'Barbade': 'Barbados', 'Biélorussie': 'Bielorrússia', 'Belgique': 'Bélgica', 'Belize': 'Belize',
  'Bénin': 'Benin', 'Bermudes': 'Bermudas', 'Bhoutan': 'Butão', 'Birmanie': 'Mianmar', 'Bolivie': 'Bolívia',
  'Bosnie-Herzégovine': 'Bósnia e Herzegovina', 'Botswana': 'Botsuana', 'Brésil': 'Brasil', 'Brunei': 'Brunei',
  'Bulgarie': 'Bulgária', 'Burkina': 'Burkina Faso', 'Burundi': 'Burundi', 'Cambodge': 'Camboja',
  'Cameroun': 'Camarões', 'Canada': 'Canadá', 'Cap-Vert': 'Cabo Verde', 'République Centrafricaine': 'República Centro-Africana',
  'Tchad': 'Chade', 'Chili': 'Chile', 'Chine': 'China', 'Chypre': 'Chipre', 'Colombie': 'Colômbia',
  'Comores': 'Comores', 'Congo': 'Congo', 'Corée': 'Coreia', 'Corée du Nord': 'Coreia do Norte', 'Corée du Sud': 'Coreia do Sul',
  'Costa Rica': 'Costa Rica', 'Côte d\'Ivoire': 'Costa do Marfim', 'Croatie': 'Croácia', 'Cuba': 'Cuba',
  'Danemark': 'Dinamarca', 'Djibouti': 'Djibuti', 'Dominique': 'Dominica', 'Égypte': 'Egito',
  'Émirats Arabes Unis': 'Emirados Árabes Unidos', 'Équateur': 'Equador', 'Érythrée': 'Eritreia',
  'Espagne': 'Espanha', 'Estonie': 'Estônia', 'États-Unis': 'Estados Unidos', 'Éthiopie': 'Etiópia',
  'Fidji': 'Fiji', 'Finlande': 'Finlândia', 'France': 'França', 'Gabon': 'Gabão', 'Gambie': 'Gâmbia',
  'Géorgie': 'Geórgia', 'Ghana': 'Gana', 'Gibraltar': 'Gibraltar', 'Grèce': 'Grécia', 'Grenade': 'Granada',
  'Groenland': 'Groenlândia', 'Guadeloupe': 'Guadalupe', 'Guam': 'Guam', 'Guatemala': 'Guatemala',
  'Guernesey': 'Guernsey', 'Guinée': 'Guiné', 'Guinée équatoriale': 'Guiné Equatorial', 'Guinée-Bissau': 'Guiné-Bissau',
  'Guyana': 'Guiana', 'Guyane française': 'Guiana Francesa', 'Haïti': 'Haiti', 'Honduras': 'Honduras',
  'Hong Kong': 'Hong Kong', 'Hongrie': 'Hungria', 'Inde': 'Índia', 'Indonésie': 'Indonésia', 'Irak': 'Iraque',
  'Iran': 'Irã', 'Irlande': 'Irlanda', 'Irlande du Nord': 'Irlanda do Norte', 'Islande': 'Islândia',
  'Israël': 'Israel', 'Italie': 'Itália', 'Jamaïque': 'Jamaica', 'Japon': 'Japão', 'Jersey': 'Jersey',
  'Jordanie': 'Jordânia', 'Kazakhstan': 'Cazaquistão', 'Kenya': 'Quênia', 'Kirghizistan': 'Quirguistão',
  'Kiribati': 'Kiribati', 'Kosovo': 'Kosovo', 'Koweït': 'Kuwait', 'Laos': 'Laos', 'Lesotho': 'Lesoto',
  'Lettonie': 'Letônia', 'Liban': 'Líbano', 'Liberia': 'Libéria', 'Libye': 'Líbia', 'Liechtenstein': 'Liechtenstein',
  'Lituanie': 'Lituânia', 'Luxembourg': 'Luxemburgo', 'Macao': 'Macau', 'Macédoine': 'Macedônia',
  'Madagascar': 'Madagascar', 'Malaisie': 'Malásia', 'Malawi': 'Malaui', 'Maldives': 'Maldivas',
  'Mali': 'Mali', 'Malte': 'Malta', 'Maroc': 'Marrocos', 'Martinique': 'Martinica', 'Mauritanie': 'Mauritânia',
  'Maurice': 'Maurício', 'Mayotte': 'Maiote', 'Mexique': 'México', 'Micronésie': 'Micronésia',
  'Moldavie': 'Moldávia', 'Monaco': 'Mônaco', 'Mongolie': 'Mongólia', 'Monténégro': 'Montenegro',
  'Montserrat': 'Montserrat', 'Mozambique': 'Moçambique', 'Namibie': 'Namíbia', 'Nauru': 'Nauru',
  'Népal': 'Nepal', 'Nicaragua': 'Nicarágua', 'Niger': 'Níger', 'Nigeria': 'Nigéria', 'Niue': 'Niue',
  'Norvège': 'Noruega', 'Nouvelle-Calédonie': 'Nova Caledônia', 'Nouvelle-Zélande': 'Nova Zelândia',
  'Oman': 'Omã', 'Ouganda': 'Uganda', 'Ouzbékistan': 'Uzbequistão', 'Pakistan': 'Paquistão', 'Palaos': 'Palau',
  'Palestine': 'Palestina', 'Panama': 'Panamá', 'Papouasie-Nouvelle-Guinée': 'Papua Nova Guiné', 'Paraguay': 'Paraguai',
  'Pays-Bas': 'Holanda', 'Pérou': 'Peru', 'Philippines': 'Filipinas', 'Pologne': 'Polônia',
  'Polynésie française': 'Polinésia Francesa', 'Porto Rico': 'Porto Rico', 'Portugal': 'Portugal', 'Qatar': 'Catar',
  'La Réunion': 'Reunião', 'Roumanie': 'Romênia', 'Royaume-Uni': 'Reino Unido', 'Russie': 'Rússia',
  'Rwanda': 'Ruanda', 'Sahara occidental': 'Saara Ocidental', 'Saint-Barthélemy': 'São Bartolomeu',
  'Saint-Marin': 'San Marino', 'Saint-Martin': 'São Martinho', 'Saint-Pierre-et-Miquelon': 'Saint-Pierre e Miquelon',
  'Saint-Vincent-et-les-Grenadines': 'São Vicente e Granadinas', 'Sainte-Hélène': 'Santa Helena',
  'Sainte-Lucie': 'Santa Lúcia', 'Samoa': 'Samoa', 'Samoa américaines': 'Samoa Americana',
  'Sao Tomé-et-Principe': 'São Tomé e Príncipe', 'Sénégal': 'Senegal', 'Serbie': 'Sérvia',
  'Seychelles': 'Seicheles', 'Sierra Leone': 'Serra Leoa', 'Singapour': 'Singapura', 'Sint Maarten': 'Sint Maarten',
  'Slovaquie': 'Eslováquia', 'Slovénie': 'Eslovênia', 'Somalie': 'Somália', 'Soudan': 'Sudão',
  'Soudan du Sud': 'Sudão do Sul', 'Sri Lanka': 'Sri Lanka', 'Suède': 'Suécia', 'Suisse': 'Suíça',
  'Suriname': 'Surinã', 'Swaziland': 'Eswatíni', 'Syrie': 'Síria', 'Tadjikistan': 'Tajiquistão',
  'Taïwan': 'Taiwan', 'Tanzanie': 'Tanzânia', 'Tchéquie': 'República Tcheca', 'Thaïlande': 'Tailândia',
  'Timor oriental': 'Timor-Leste', 'Togo': 'Togo', 'Tokelau': 'Toquelau', 'Tonga': 'Tonga',
  'Trinité-et-Tobago': 'Trinidad e Tobago', 'Tunisie': 'Tunísia', 'Turkménistan': 'Turcomenistão',
  'Turquie': 'Turquia', 'Tuvalu': 'Tuvalu', 'Ukraine': 'Ucrânia', 'Uruguay': 'Uruguai',
  'Vanuatu': 'Vanuatu', 'Vatican': 'Vaticano', 'Venezuela': 'Venezuela', 'Viêt Nam': 'Vietnã',
  'Wallis-et-Futuna': 'Wallis e Futuna', 'Yémen': 'Iêmen', 'Zambie': 'Zâmbia', 'Zimbabwe': 'Zimbábue',
  
  // Polonês
  'Afganistan': 'Afeganistão', 'Albania': 'Albânia', 'Algieria': 'Argélia', 'Andora': 'Andorra', 'Angola': 'Angola',
  'Antigua i Barbuda': 'Antígua e Barbuda', 'Arabia Saudyjska': 'Arábia Saudita', 'Argentyna': 'Argentina', 'Armenia': 'Armênia',
  'Aruba': 'Aruba', 'Australia': 'Austrália', 'Austria': 'Áustria', 'Azerbejdżan': 'Azerbaijão', 'Bahamy': 'Bahamas',
  'Bahrajn': 'Bahrein', 'Bangladesz': 'Bangladesh', 'Barbados': 'Barbados', 'Białoruś': 'Bielorrússia', 'Belgia': 'Bélgica',
  'Belize': 'Belize', 'Benin': 'Benin', 'Bermudy': 'Bermudas', 'Bhutan': 'Butão', 'Białoruś': 'Bielorrússia',
  'Birma': 'Mianmar', 'Boliwia': 'Bolívia', 'Bośnia i Hercegowina': 'Bósnia e Herzegovina', 'Botswana': 'Botsuana',
  'Brazylia': 'Brasil', 'Brunei': 'Brunei', 'Bułgaria': 'Bulgária', 'Burkina Faso': 'Burkina Faso', 'Burundi': 'Burundi',
  'Cambodża': 'Camboja', 'Kamerun': 'Camarões', 'Kanada': 'Canadá', 'Wyspy Zielonego Przylądka': 'Cabo Verde',
  'Republika Środkowoafrykańska': 'República Centro-Africana', 'Czad': 'Chade', 'Chile': 'Chile', 'Chıny': 'China',
  'Cypr': 'Chipre', 'Kolumbia': 'Colômbia', 'Komory': 'Comores', 'Kongo': 'Congo', 'Korea Płn.': 'Coreia do Norte',
  'Korea Płd.': 'Coreia do Sul', 'Kostaryka': 'Costa Rica', 'Wybrzeze Słoniowca': 'Costa do Marfim', 'Chorwacja': 'Croácia',
  'Kuba': 'Cuba', 'Dąnija': 'Dinamarca', 'Djibouti': 'Djibuti', 'Dominika': 'Dominica', 'Dominikana': 'República Dominicana',
  'Ekwador': 'Equador', 'Egipt': 'Egito', 'Salwador': 'El Salvador', 'Anglia': 'Inglaterra', 'Gwinea Równikowa': 'Guiné Equatorial',
  'Erytrea': 'Eritreia', 'Estonia': 'Estônia', 'Etiopia': 'Etiópia', 'Fidży': 'Fiji', 'Finlandia': 'Finlândia',
  'Francja': 'França', 'Gabon': 'Gabão', 'Gambia': 'Gâmbia', 'Gruzja': 'Geórgia', 'Niemcy': 'Alemanha',
  'Ghana': 'Gana', 'Grecja': 'Grécia', 'Grenada': 'Granada', 'Gwadelupa': 'Guadalupe', 'Guam': 'Guam',
  'Gwatemala': 'Guatemala', 'Guernsey': 'Guernsey', 'Gwinea': 'Guiné', 'Gwinea Bissau': 'Guiné-Bissau', 'Gwinea Równikowa': 'Guiné Equatorial',
  'Gujana': 'Guiana', 'Gujana Francuska': 'Guiana Francesa', 'Haiti': 'Haiti', 'Honduras': 'Honduras', 'Hong Kong': 'Hong Kong',
  'Węgry': 'Hungria', 'Islandia': 'Islândia', 'Indie': 'Índia', 'Indonezja': 'Indonésia', 'Iran': 'Irã',
  'Irak': 'Iraque', 'Irlandia': 'Irlanda', 'Irlandia Północna': 'Irlanda do Norte', 'Izrael': 'Israel', 'Włochy': 'Itália',
  'Jamajka': 'Jamaica', 'Japonia': 'Japão', 'Jersey': 'Jersey', 'Jordania': 'Jordânia', 'Kazachstan': 'Cazaquistão',
  'Kenia': 'Quênia', 'Kirgistan': 'Quirguistão', 'Kiribati': 'Kiribati', 'Kosovo': 'Kosovo', 'Kuwejt': 'Kuwait',
  'Laos': 'Laos', 'Lesoto': 'Lesoto', 'Litwa': 'Lituânia', 'Liban': 'Líbano', 'Liberia': 'Libéria',
  'Libia': 'Líbia', 'Liechtenstein': 'Liechtenstein', 'Luksemburg': 'Luxemburgo', 'Makao': 'Macau', 'Madagaskar': 'Madagascar',
  'Malawi': 'Malaui', 'Malezja': 'Malásia', 'Maledywy': 'Maldivas', 'Mali': 'Mali', 'Malta': 'Malta',
  'Maroko': 'Marrocos', 'Martynika': 'Martinica', 'Mauretania': 'Mauritânia', 'Mauritius': 'Maurício', 'Majotta': 'Maiote',
  'Meksyk': 'México', 'Mikronezja': 'Micronésia', 'Mołdawia': 'Moldávia', 'Monako': 'Mônaco', 'Mongolia': 'Mongólia',
  'Czarnogora': 'Montenegro', 'Montserrat': 'Montserrat', 'Mozambik': 'Moçambique', 'Namibia': 'Namíbia', 'Nauru': 'Nauru',
  'Nepal': 'Nepal', 'Nikaraqua': 'Nicarágua', 'Niger': 'Níger', 'Nigeria': 'Nigéria', 'Niue': 'Niue',
  'Norwegia': 'Noruega', 'Nowa Kaledonia': 'Nova Caledônia', 'Nowa Zelandia': 'Nova Zelândia', 'Oman': 'Omã',
  'Pakistan': 'Paquistão', 'Palau': 'Palau', 'Palestyna': 'Palestina', 'Panama': 'Panamá', 'Papua Nowa Gwinea': 'Papua Nova Guiné',
  'Paragwaj': 'Paraguai', 'Peru': 'Peru', 'Filipiny': 'Filipinas', 'Polska': 'Polônia', 'Polinezja Francuska': 'Polinésia Francesa',
  'Portoryko': 'Porto Rico', 'Portugalia': 'Portugal', 'Katar': 'Catar', 'Reunion': 'Reunião', 'Rumunia': 'Romênia',
  'Rosja': 'Rússia', 'Ruanda': 'Ruanda', 'Sahara Zachodnia': 'Saara Ocidental', 'Saint Barthelemy': 'São Bartolomeu',
  'Saint Martin': 'São Martinho', 'Saint Pierre i Miquelon': 'Saint-Pierre e Miquelon', 'Saint Vincent i Grenadyny': 'São Vicente e Granadinas',
  'Samoa': 'Samoa', 'Samoa Amerykańska': 'Samoa Americana', 'San Marino': 'San Marino', 'Sao Tome i Principe': 'São Tomé e Príncipe',
  'Senegal': 'Senegal', 'Serbia': 'Sérvia', 'Seszele': 'Seicheles', 'Sierra Leone': 'Serra Leoa', 'Singapur': 'Singapura',
  'Sint Maarten': 'Sint Maarten', 'Slowacja': 'Eslováquia', 'Slowenia': 'Eslovênia', 'Wyspy Salomona': 'Ilhas Salomão',
  'Somalia': 'Somália', 'Poludniowa Afryka': 'África do Sul', 'Poludniowy Sudan': 'Sudão do Sul', 'Hiszpania': 'Espanha',
  'Sri Lanka': 'Sri Lanka', 'Sudan': 'Sudão', 'Surinam': 'Surinã', 'Eswatini': 'Eswatíni', 'Szwecja': 'Suécia',
  'Szwajcaria': 'Suíça', 'Syria': 'Síria', 'Tajwan': 'Taiwan', 'Tadżykistan': 'Tajiquistão', 'Tanzania': 'Tanzânia',
  'Tajlandia': 'Tailândia', 'Timor Wschodni': 'Timor-Leste', 'Togo': 'Togo', 'Tokelau': 'Toquelau', 'Tonga': 'Tonga',
  'Trynidad i Tobago': 'Trinidad e Tobago', 'Tunezja': 'Tunísia', 'Turkmenistan': 'Turcomenistão', 'Turcja': 'Turquia',
  'Tuvalu': 'Tuvalu', 'Ukraina': 'Ucrânia', 'Uganada': 'Uganda', 'Zjednoczone Emiraty Arabskie': 'Emirados Árabes Unidos',
  'Stany Zjednoczone': 'Estados Unidos', 'Urugwaj': 'Uruguai', 'Uzbekistan': 'Uzbequistão', 'Vanuatu': 'Vanuatu',
  'Watykan': 'Vaticano', 'Wenezuela': 'Venezuela', 'Wietnam': 'Vietnã', 'Walia': 'País de Gales',
  'Jemen': 'Iêmen', 'Zambia': 'Zâmbia', 'Zimbabwe': 'Zimbábue',
};

function translateCountry(country: string): string {
  return COUNTRY_TRANSLATIONS[country] || country;
}

interface Player {
  nome: string;
  idade: number | string;
  overall: number | string;
  potencial: number | string;
  time: string;
  liga?: string;
  posicoes: string[];
  pais?: string;
  imagem?: string;
  valorMercado?: string;
}

interface ScraperResult {
  success: boolean;
  error: string | null;
  players: Player[];
  count?: number;
}

// Lista expandida de User-Agents para rotacionar
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Simular comportamento de usuário real com delays variáveis
async function randomDelay(min: number = 500, max: number = 2000): Promise<void> {
  const delay = Math.random() * (max - min) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

async function fetchPageWithScraperAPI(url: string): Promise<string> {
  const apiKey = process.env.SCRAPER_API_KEY;
  
  if (!apiKey) {
    throw new Error('SCRAPER_API_KEY não configurada. Usando fallback sem proxy.');
  }

  try {
    console.log('Usando ScraperAPI para contornar bloqueios...');
    
    const scraperApiUrl = 'https://api.scraperapi.com';
    const params = {
      api_key: apiKey,
      url: url,
      render: 'false', // Não precisa renderizar JavaScript
    };

    const response = await axios.get(scraperApiUrl, {
      params,
      timeout: 60000,
      validateStatus: (status) => status < 500,
    });

    if (response.status === 403) {
      throw new Error('ScraperAPI também foi bloqueado. Tente novamente em alguns minutos.');
    }

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erro ao usar ScraperAPI:', errorMessage);
    throw error;
  }
}

async function fetchPageWithRetry(url: string, maxRetries: number = 3): Promise<string> {
  let lastError: Error | null = null;

  // Tentar com ScraperAPI primeiro
  try {
    return await fetchPageWithScraperAPI(url);
  } catch (error) {
    lastError = error instanceof Error ? error : new Error(String(error));
    console.log('ScraperAPI falhou, tentando sem proxy...');
  }

  // Fallback: tentar sem proxy com retry com delays maiores
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Aumentar delays progressivamente: 5s, 10s, 20s, 40s
        const baseDelay = Math.min(5000 * Math.pow(2, attempt - 1), 40000);
        const randomVariation = Math.random() * 3000 - 1500;
        const totalDelay = Math.max(3000, baseDelay + randomVariation);
        
        console.log(`Tentativa ${attempt + 1}/${maxRetries} após ${Math.round(totalDelay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }

      const headers = {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Pragma': 'no-cache',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Referer': 'https://www.google.com/',
      };

      const response = await axios.get(url, {
        headers,
        timeout: 45000,
        validateStatus: (status) => status < 500,
        maxRedirects: 5,
      });

      if (response.status === 403) {
        lastError = new Error('O SoFIFA está bloqueando requisições. Use ScraperAPI ou VPN.');
        
        if (attempt < maxRetries - 1) {
          // Esperar mais tempo para 403
          await randomDelay(8000, 15000);
        }
        continue;
      }

      if (response.status === 429) {
        lastError = new Error('Muitas requisições. Aguardando antes de tentar novamente...');
        
        if (attempt < maxRetries - 1) {
          // Esperar muito mais tempo para 429
          await randomDelay(15000, 30000);
        }
        continue;
      }

      if (response.status !== 200) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        continue;
      }

      return response.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Tentativa ${attempt + 1} falhou:`, lastError.message);
      
      if (attempt === maxRetries - 1) {
        break;
      }
    }
  }

  // TERCEIRA OPCAO: Fallback para Puppeteer se requisições diretas falharem
  console.log('[Puppeteer] Tentando com navegador headless como último recurso...');
  try {
    const html = await fetchPageWithPuppeteer(url);
    if (html && html.length > 500) {
      console.log('[Puppeteer] Sucesso! HTML obtido com Puppeteer');
      return html;
    }
  } catch (puppeteerError) {
    console.error('[Puppeteer] Falha:', puppeteerError instanceof Error ? puppeteerError.message : String(puppeteerError));
  }
  
  throw lastError || new Error('Falha ao acessar a URL após múltiplas tentativas (requisições diretas e Puppeteer)');
}

async function fetchPageWithPuppeteer(url: string): Promise<string> {
  let browser;
  try {
    console.log('[Puppeteer] Iniciando navegador...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    console.log('[Puppeteer] Criando página...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Definir headers realistas
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navegar para a página
    console.log('[Puppeteer] Navegando para:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('[Puppeteer] Página carregada, aguardando 2s...');
    // Aguardar um pouco para garantir que o conteúdo foi carregado
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Obter o HTML renderizado
    console.log('[Puppeteer] Obtendo HTML...');
    const html = await page.content();
    
    console.log('[Puppeteer] Fechando navegador...');
    await browser.close();
    console.log('[Puppeteer] Sucesso!');
    return html;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Puppeteer] Erro:', errorMessage);
    throw error;
  }
}

function extractPlayers(html: string): Player[] {
  const $ = load(html);
  const players: Player[] = [];

  // Validar se é página de erro do Cloudflare
  if (html.includes('Sorry, you have been blocked') || html.includes('Cloudflare')) {
    console.error('[Cloudflare] Página bloqueada pelo Cloudflare');
    throw new Error('SoFIFA está bloqueando requisições. Tente novamente em alguns minutos ou use ScraperAPI com créditos.');
  }

  try {
    $('tbody tr').each((_, row) => {
      try {
        const $row = $(row);
        const $cells = $row.find('td');
        
        // TD[1] - Nome (via link) e Posições (via spans)
        const $td1 = $cells.eq(1);
        const nomeLink = $td1.find('a[href*="/player/"]').first();
        const nome = nomeLink.text().trim() || '';
        
        // Extrair posicoes usando seletores CSS (mais confiável)
        const posicoes: string[] = [];
        
        // Método 1: Extrair de span.pos (mais confiável)
        $td1.find('span.pos').each((_, span) => {
          const posText = $(span).text().trim();
          if (posText && posText.length >= 2 && posText.length <= 4 && /^[A-Z]+$/.test(posText)) {
            const translated = translatePosition(posText);
            // Evitar duplicatas
            if (!posicoes.includes(translated)) {
              posicoes.push(translated);
            }
          }
        });
        
        // Método 2: Fallback - extrair do texto se método 1 não encontrou nada
        if (posicoes.length === 0) {
          const td1Text = $td1.text().trim();
          const lines = td1Text.split('\n').filter(l => l.trim().length > 0);
          if (lines.length > 1) {
            // Primeira linha é o nome, resto são posições
            for (let i = 1; i < lines.length; i++) {
              const posText = lines[i].trim();
              // Filtrar apenas posicoes validas (2-4 caracteres)
              if (posText && posText.length >= 2 && posText.length <= 4 && /^[A-Z]+$/.test(posText)) {
                const translated = translatePosition(posText);
                // Evitar duplicatas
                if (!posicoes.includes(translated)) {
                  posicoes.push(translated);
                }
              }
            }
          }
        }
        
        // TD[2] - Idade
        const idade = $cells.eq(2).text().trim() || '';
        
        // TD[3] - Overall
        const overall = $cells.eq(3).text().trim() || '';
        
        // TD[4] - Potencial
        const potencial = $cells.eq(4).text().trim() || '';
        
        // TD[5] - Time (primeiro link) e Liga (segundo link)
        const time = $cells.eq(5).find('a').first().text().trim() || '';
        const liga = $cells.eq(5).find('a').eq(1).text().trim() || undefined;
        
        // TD[16] - Valor de Mercado (com unidade M/K)
        // Se a tabela tem poucas colunas (renderização normal), tenta TD[6]
        // Se tem muitas colunas (ScraperAPI), usa TD[16]
        let valorMercado: string | undefined = $cells.eq(16).text().trim();
        if (!valorMercado && $cells.length < 20) {
          valorMercado = $cells.eq(6).text().trim();
        }
        valorMercado = valorMercado || undefined;

        // País do jogador (via flag em TD[1])
        const flagImg = $td1.find('img.flag');
        const paisIngles = flagImg.attr('title') || '';
        const pais = paisIngles ? translateCountry(paisIngles) : undefined;

        // Imagem do jogador (em TD[0] com classe player-check)
        const playerImg = $cells.eq(0).find('img.player-check');
        const imagem = playerImg.attr('data-src') || 
                       playerImg.attr('src') || 
                       undefined;

        if (nome && overall) {
          players.push({
            nome,
            idade: isNaN(Number(idade)) ? idade : Number(idade),
            overall: extractNumericValue(overall),
            potencial: extractNumericValue(potencial),
            time,
            liga,
            posicoes,
            pais,
            imagem,
            valorMercado,
          });
        }
      } catch (err) {
        console.error('Erro ao processar linha da tabela:', err);
      }
    });
  } catch (err) {
    console.error('Erro ao extrair jogadores:', err);
  }

  return players;
}

export async function scrapeSofifaPlayers(url: string): Promise<ScraperResult> {
  try {
    if (!url || !url.includes('sofifa.com')) {
      return {
        success: false,
        error: 'URL inválida. Certifique-se de que é uma URL do SoFIFA.',
        players: [],
      };
    }

    console.log(`Iniciando scraping de: ${url}`);

    const html = await fetchPageWithRetry(url);

    const players = extractPlayers(html);

    if (players.length === 0) {
      return {
        success: false,
        error: 'Nenhum jogador encontrado. A página pode estar vazia ou a estrutura do SoFIFA pode ter mudado.',
        players: [],
      };
    }

    return {
      success: true,
      error: null,
      players,
      count: players.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro no scraper:', errorMessage);

    return {
      success: false,
      error: `Erro ao acessar página: ${errorMessage}`,
      players: [],
    };
  }
}

export async function scrapeSofifaPlayersBatch(baseUrl: string, startOffset: number, endOffset: number, step: number = 60): Promise<ScraperResult> {
  try {
    if (!baseUrl || !baseUrl.includes('sofifa.com')) {
      return {
        success: false,
        error: 'URL inválida. Certifique-se de que é uma URL do SoFIFA.',
        players: [],
      };
    }

    // Validar intervalo
    if (startOffset < 0 || endOffset < startOffset) {
      return {
        success: false,
        error: 'Intervalo inválido. O offset final deve ser maior ou igual ao inicial.',
        players: [],
      };
    }

    if (endOffset - startOffset > 1200) {
      return {
        success: false,
        error: 'Intervalo muito grande. Máximo de 1200 offsets por vez (20 páginas).',
        players: [],
      };
    }

    const allPlayers: Player[] = [];
    const offsets = [];

    // Gerar lista de offsets
    for (let offset = startOffset; offset <= endOffset; offset += step) {
      offsets.push(offset);
    }

    console.log(`Iniciando scraping em lote: ${offsets.length} páginas, offsets: ${startOffset} a ${endOffset}`);

    // Extrair cada página
    let consecutiveEmptyPages = 0;
    const maxConsecutiveEmpty = 2; // Parar após 2 páginas vazias consecutivas
    
    for (let i = 0; i < offsets.length; i++) {
      const offset = offsets[i];
      
      try {
        // Construir URL com novo offset
        const separator = baseUrl.includes('?') ? '&' : '?';
        const urlWithoutOffset = baseUrl.replace(/[?&]offset=\d+/, '');
        const pageUrl = `${urlWithoutOffset}${separator}offset=${offset}`;

        console.log(`[${i + 1}/${offsets.length}] Extraindo página com offset ${offset}...`);

        const html = await fetchPageWithRetry(pageUrl);
        const players = extractPlayers(html);

        if (players.length > 0) {
          allPlayers.push(...players);
          console.log(`  ✓ ${players.length} jogadores encontrados`);
          consecutiveEmptyPages = 0; // Reset contador
        } else {
          console.log(`  ⚠ Nenhum jogador encontrado nesta página`);
          consecutiveEmptyPages++;
          
          // Parar se encontrar múltiplas páginas vazias consecutivas
          if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
            console.log(`\n⚠️  Detectadas ${consecutiveEmptyPages} páginas vazias consecutivas. Parando extração.`);
            console.log(`📊 Total de jogadores extraídos: ${allPlayers.length}`);
            break;
          }
        }

        // Delay entre requisições para não sobrecarregar (reduzido para velocidade)
        if (i < offsets.length - 1) {
          // Delay menor: 300-800ms (ScraperAPI já faz rate limiting)
          await randomDelay(300, 800);
        }
      } catch (pageError) {
        const errorMessage = pageError instanceof Error ? pageError.message : 'Erro desconhecido';
        console.error(`Erro ao extrair página com offset ${offset}:`, errorMessage);
        consecutiveEmptyPages++;
        
        // Parar se encontrar múltiplos erros consecutivos
        if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
          console.log(`\n⚠️  Detectados ${consecutiveEmptyPages} erros consecutivos. Parando extração.`);
          console.log(`📊 Total de jogadores extraídos: ${allPlayers.length}`);
          break;
        }
      }
    }

    if (allPlayers.length === 0) {
      return {
        success: false,
        error: 'Nenhum jogador encontrado em nenhuma das páginas. Verifique o intervalo de offsets.',
        players: [],
      };
    }

    return {
      success: true,
      error: null,
      players: allPlayers,
      count: allPlayers.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro no scraper em lote:', errorMessage);

    return {
      success: false,
      error: `Erro ao extrair em lote: ${errorMessage}`,
      players: [],
    };
  }
}

// Função para fazer download de imagens dos jogadores em ZIP
export async function downloadPlayerImages(players: Player[]): Promise<Buffer> {
  try {
    // Usar JSZip que é mais simples e não requer dependências externas
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Criar pasta para imagens
    const imagesFolder = zip.folder('imagens_jogadores');
    
    if (!imagesFolder) {
      throw new Error('Erro ao criar pasta no ZIP');
    }
    
    // Download de cada imagem
    for (const player of players) {
      if (player.imagem) {
        try {
          // Sanitizar nome do jogador para usar como nome de arquivo
          const sanitizedName = player.nome
            .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
            .replace(/\s+/g, '_') // Substitui espaços por underscore
            .toLowerCase();
          
          // Fazer download da imagem
          const response = await axios.get(player.imagem, {
            responseType: 'arraybuffer',
            timeout: 10000,
          });
          
          // Adicionar imagem ao ZIP com nome do jogador
          const ext = player.imagem.includes('.png') ? 'png' : 'jpg';
          imagesFolder.file(`${sanitizedName}.${ext}`, response.data);
          
          console.log(`✓ Imagem de ${player.nome} adicionada ao ZIP`);
        } catch (imgError) {
          const errorMessage = imgError instanceof Error ? imgError.message : 'Erro desconhecido';
          console.warn(`⚠ Erro ao baixar imagem de ${player.nome}: ${errorMessage}`);
          // Continuar com próximo jogador em caso de erro
        }
      }
    }
    
    // Gerar buffer do ZIP
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    if (!buffer) {
      throw new Error('Erro ao gerar arquivo ZIP');
    }
    
    return buffer;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao criar ZIP de imagens:', errorMessage);
    throw error;
  }
}


// Interface para times
interface Team {
  imagem?: string;           // URL da imagem/logo do time
  nome: string;              // Nome do time
  liga: string;              // Liga do time
  orcamento: string;         // Orçamento de transferências
  rival: string;             // Time rival
  prestigioInternacional: string | number;  // Prestígio internacional
  prestigioLocal: string | number;          // Prestígio local (doméstico)
  estadio: string;           // Estádio
}

interface TeamResult {
  success: boolean;
  error: string | null;
  teams: Team[];
  count?: number;
}


// Função para traduzir código de país para português
function translateCountryCode(code: string): string {
  const countryMap: Record<string, string> = {
    'DE': 'Alemanha',
    'ES': 'Espanha',
    'FR': 'França',
    'IT': 'Itália',
    'PT': 'Portugal',
    'BR': 'Brasil',
    'AR': 'Argentina',
    'GB': 'Inglaterra',
    'NL': 'Holanda',
    'BE': 'Bélgica',
    'AT': 'Áustria',
    'CH': 'Suíça',
    'SE': 'Suécia',
    'NO': 'Noruega',
    'DK': 'Dinamarca',
    'PL': 'Polônia',
    'CZ': 'República Tcheca',
    'RO': 'Romênia',
    'GR': 'Grécia',
    'TR': 'Turquia',
    'RU': 'Rússia',
    'UA': 'Ucrânia',
    'JP': 'Japão',
    'CN': 'China',
    'IN': 'Índia',
    'MX': 'México',
    'US': 'Estados Unidos',
    'CA': 'Canadá',
    'AU': 'Austrália',
    'ZA': 'África do Sul',
    'EG': 'Egito',
    'NG': 'Nigéria',
    'KR': 'Coreia do Sul',
    'TH': 'Tailândia',
    'SG': 'Singapura',
    'MY': 'Malásia',
    'ID': 'Indonésia',
    'PH': 'Filipinas',
    'VN': 'Vietnã',
    'CL': 'Chile',
    'CO': 'Colômbia',
    'PE': 'Peru',
    'UY': 'Uruguai',
    'PY': 'Paraguai',
    'BO': 'Bolívia',
    'EC': 'Equador',
    'VE': 'Venezuela',
    'CU': 'Cuba',
    'JM': 'Jamaica',
    'CR': 'Costa Rica',
    'PA': 'Panamá',
    'HN': 'Honduras',
    'SV': 'El Salvador',
    'GT': 'Guatemala',
    'NI': 'Nicarágua',
    'BZ': 'Belize',
    'DO': 'República Dominicana',
    'PR': 'Porto Rico',
    'TT': 'Trinidad e Tobago',
    'BB': 'Barbados',
    'BS': 'Bahamas',
    'BH': 'Bahrein',
    'QA': 'Catar',
    'AE': 'Emirados Árabes Unidos',
    'SA': 'Arábia Saudita',
    'KW': 'Kuwait',
    'OM': 'Omã',
    'YE': 'Iêmen',
    'IL': 'Israel',
    'JO': 'Jordânia',
    'LB': 'Líbano',
    'SY': 'Síria',
    'IQ': 'Iraque',
    'IR': 'Irã',
    'AF': 'Afeganistão',
    'PK': 'Paquistão',
    'BD': 'Bangladesh',
    'LK': 'Sri Lanka',
    'NP': 'Nepal',
    'BT': 'Butão',
    'MM': 'Mianmar',
    'KH': 'Camboja',
    'LA': 'Laos',
    'HK': 'Hong Kong',
    'TW': 'Taiwan',
    'MO': 'Macau',
    'NZ': 'Nova Zelândia',
    'FJ': 'Fiji',
    'PG': 'Papua Nova Guiné',
    'SB': 'Ilhas Salomão',
    'VU': 'Vanuatu',
    'WS': 'Samoa',
    'TO': 'Tonga',
    'KI': 'Quiribáti',
    'MH': 'Ilhas Marshall',
    'FM': 'Micronésia',
    'PW': 'Palau',
    'GU': 'Guam',
    'AS': 'Samoa Americana',
    'MP': 'Ilhas Marianas do Norte',
    'VI': 'Ilhas Virgens Americanas',
    'GS': 'Geórgia do Sul e Ilhas Sandwich do Sul',
    'FK': 'Ilhas Malvinas',
    'GI': 'Gibraltar',
    'MT': 'Malta',
    'CY': 'Chipre',
    'IS': 'Islândia',
    'IE': 'Irlanda',
    'LU': 'Luxemburgo',
    'HR': 'Croácia',
    'SI': 'Eslovênia',
    'SK': 'Eslováquia',
    'HU': 'Hungria',
    'RS': 'Sérvia',
    'BG': 'Bulgária',
    'BA': 'Bósnia e Herzegovina',
    'ME': 'Montenegro',
    'MK': 'Macedônia do Norte',
    'AL': 'Albânia',
    'XK': 'Kosovo',
    'BY': 'Bielorrússia',
    'MD': 'Moldávia',
    'GE': 'Geórgia',
    'AM': 'Armênia',
    'AZ': 'Azerbaijão',
    'KZ': 'Cazaquistão',
    'UZ': 'Uzbequistão',
    'TM': 'Turcomenistão',
    'KG': 'Quirguistão',
    'TJ': 'Tajiquistão',
    'MN': 'Mongólia',
    'KP': 'Coreia do Norte',
    'TL': 'Timor-Leste',
    'BN': 'Brunei',
    'MV': 'Maldivas',
    'ET': 'Etiópia',
    'KE': 'Quênia',
    'TZ': 'Tanzânia',
    'UG': 'Uganda',
    'RW': 'Ruanda',
    'BJ': 'Benin',
    'BF': 'Burkina Faso',
    'CI': 'Costa do Marfim',
    'CM': 'Camarões',
    'CF': 'República Centro-Africana',
    'TD': 'Chade',
    'CG': 'Congo',
    'CD': 'República Democrática do Congo',
    'GA': 'Gabão',
    'GQ': 'Guiné Equatorial',
    'ST': 'São Tomé e Príncipe',
    'SC': 'Seicheles',
    'MU': 'Maurício',
    'MG': 'Madagascar',
    'MW': 'Malaui',
    'MZ': 'Moçambique',
    'ZM': 'Zâmbia',
    'ZW': 'Zimbábue',
    'BW': 'Botsuana',
    'NA': 'Namíbia',
    'LS': 'Lesoto',
    'SZ': 'Eswatini',
    'DZ': 'Argélia',
    'MA': 'Marrocos',
    'TN': 'Tunísia',
    'LY': 'Líbia',
    'SD': 'Sudão',
    'SS': 'Sudão do Sul',
    'SO': 'Somália',
    'DJ': 'Djibuti',
    'ER': 'Eritreia',
    'GH': 'Gana',
    'GM': 'Gâmbia',
    'GN': 'Guiné',
    'GW': 'Guiné-Bissau',
    'LR': 'Libéria',
    'ML': 'Mali',
    'MR': 'Mauritânia',
    'NE': 'Níger',
    'SN': 'Senegal',
    'SL': 'Serra Leoa',
    'TG': 'Togo',
  };

  return countryMap[code] || code;
}

// REMOVIDO: Funcionalidade de times foi removida

// Função para extrair times de uma página HTML
function extractTeams(html: string): Team[] {
  const $ = load(html);
  const teams: Team[] = [];

  // Validar se é página de erro do Cloudflare
  if (html.includes('Sorry, you have been blocked') || html.includes('Cloudflare')) {
    console.error('[Cloudflare] Página bloqueada pelo Cloudflare');
    throw new Error('SoFIFA está bloqueando requisições. Tente novamente em alguns minutos ou use ScraperAPI com créditos.');
  }

  try {
    $('tbody tr').each((_, row) => {
      try {
        const $row = $(row);
        const $cells = $row.find('td');

        // Estrutura esperada da tabela de times:
        // TD[0] - Ranking/Checkbox
        // TD[1] - Logo/Imagem do time
        // TD[2] - Nome do time
        // TD[3] - Liga
        // TD[4] - Orçamento de transferências
        // TD[5] - Time rival
        // TD[6] - Prestígio internacional
        // TD[7] - Prestígio local
        // TD[8] - Estádio

        // Extrair imagem (logo do time)
        const logoImg = $cells.eq(1).find('img');
        const imagem = logoImg.attr('data-src') || logoImg.attr('src') || undefined;

        // Extrair nome do time (via link)
        const nomeLink = $cells.eq(2).find('a').first();
        const nome = nomeLink.text().trim() || '';

        // Extrair liga
        const liga = $cells.eq(3).text().trim() || '';

        // Extrair orçamento de transferências
        const orcamento = $cells.eq(4).text().trim() || '';

        // Extrair time rival
        const rival = $cells.eq(5).text().trim() || '';

        // Extrair prestígio internacional
        const prestigioInternacional = $cells.eq(6).text().trim() || '';

        // Extrair prestígio local
        const prestigioLocal = $cells.eq(7).text().trim() || '';

        // Extrair estádio
        const estadio = $cells.eq(8).text().trim() || '';

        if (nome && liga) {
          teams.push({
            imagem,
            nome,
            liga,
            orcamento,
            rival,
            prestigioInternacional,
            prestigioLocal,
            estadio,
          });
        }
      } catch (err) {
        console.error('Erro ao processar linha da tabela de times:', err);
      }
    });
  } catch (err) {
    console.error('Erro ao extrair times:', err);
  }

  return teams;
}

export async function scrapeSofifaTeams(url: string): Promise<TeamResult> {
  try {
    if (!url || !url.includes('sofifa.com')) {
      return {
        success: false,
        error: 'URL inválida. Certifique-se de que é uma URL do SoFIFA.',
        teams: [],
      };
    }

    console.log(`Iniciando scraping de times: ${url}`);

    const html = await fetchPageWithRetry(url);

    const teams = extractTeams(html);

    if (teams.length === 0) {
      return {
        success: false,
        error: 'Nenhum time encontrado. A página pode estar vazia ou a estrutura do SoFIFA pode ter mudado.',
        teams: [],
      };
    }

    return {
      success: true,
      error: null,
      teams,
      count: teams.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro no scraper de times:', errorMessage);

    return {
      success: false,
      error: `Erro ao acessar página: ${errorMessage}`,
      teams: [],
    };
  }
}

export async function downloadTeamImages(teams: Team[]): Promise<Buffer> {
  try {
    // Usar JSZip que é mais simples e não requer dependências externas
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Criar pasta para imagens
    const imagesFolder = zip.folder('imagens_times');
    
    if (!imagesFolder) {
      throw new Error('Erro ao criar pasta no ZIP');
    }
    
    // Download de cada imagem
    for (const team of teams) {
      if (team.imagem) {
        try {
          // Sanitizar nome do time para usar como nome de arquivo
          const sanitizedName = team.nome
            .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
            .replace(/\s+/g, '_') // Substitui espaços por underscore
            .toLowerCase();
          
          // Fazer download da imagem
          const response = await axios.get(team.imagem, {
            responseType: 'arraybuffer',
            timeout: 10000,
          });
          
          // Adicionar imagem ao ZIP com nome do time
          const ext = team.imagem.includes('.png') ? 'png' : 'jpg';
          imagesFolder.file(`${sanitizedName}.${ext}`, response.data);
          
          console.log(`✓ Imagem de ${team.nome} adicionada ao ZIP`);
        } catch (imgError) {
          const errorMessage = imgError instanceof Error ? imgError.message : 'Erro desconhecido';
          console.warn(`⚠ Erro ao baixar imagem de ${team.nome}: ${errorMessage}`);
          // Continuar com próximo time em caso de erro
        }
      }
    }
    
    // Gerar buffer do ZIP
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    if (!buffer) {
      throw new Error('Erro ao gerar arquivo ZIP');
    }
    
    return buffer;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao criar ZIP de imagens de times:', errorMessage);
    throw error;
  }
}
