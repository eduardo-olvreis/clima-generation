/**
 * Converte o código do clima (WMO - World Meteorological Organization) em uma descrição textual.
 * Esta função ajuda a traduzir os códigos numéricos da API para um formato legível para o usuário.
 * @param {number} codigo - O código do clima fornecido pela API Open-Meteo.
 * @returns {string} Uma string descritiva da condição climática.
 */
const codigoClimaParaString = (codigo) => {
    const condicoes = {
        0: "Céu limpo",
        1: "Principalmente limpo",
        2: "Parcialmente nublado",
        3: "Encoberto",
        45: "Nevoeiro",
        48: "Nevoeiro depositando rima",
        51: "Garoa: Leve",
        53: "Garoa: Moderada",
        55: "Garoa: Densa",
        56: "Garoa Congelante: Leve",
        57: "Garoa Congelante: Densa",
        61: "Chuva: Leve",
        63: "Chuva: Moderada",
        65: "Chuva: Forte",
        66: "Chuva Congelante: Leve",
        67: "Chuva Congelante: Forte",
        71: "Queda de neve: Leve",
        73: "Queda de neve: Moderada",
        75: "Queda de neve: Forte",
        77: "Grãos de neve",
        80: "Pancadas de chuva: Leves",
        81: "Pancadas de chuva: Moderadas",
        82: "Pancadas de chuva: Violentas",
        85: "Pancadas de neve: Leves",
        86: "Pancadas de neve: Fortes",
        95: "Trovoada: Leve ou moderada",
        96: "Trovoada com granizo leve",
        99: "Trovoada com granizo forte",
    };
    return condicoes[codigo] || "Condição não disponível";
};

/**
 * Formata uma data string (YYYY-MM-DD) para um formato mais legível (Dia da semana, DD/MM).
 * @param {string} dateString - Data no formato YYYY-MM-DD.
 * @returns {string} Data formatada.
 */
const formatarData = (dateString) => {
    const opcoes = { weekday: 'short', day: 'numeric', month: 'numeric' };
    const data = new Date(dateString + 'T00:00:00'); // Garante que a data seja interpretada na hora local ou neutra
    return data.toLocaleDateString('pt-BR', opcoes);
};

/**
 * Função assíncrona para buscar dados meteorológicos de uma cidade específica.
 *
 * @param {string} nomeCidade O nome da cidade para a qual buscar o clima.
 * @returns {Promise<object|null>} Um objeto com os dados do clima ou null em caso de erro.
 */
async function getWeatherByCity(nomeCidade) {
    // Seleciona o container onde os resultados serão exibidos.
    const resultContainer = document.getElementById('weather-result');
    const forecastContainer = document.getElementById('forecast-result');

    // **1. Validação de Entrada**
    // Verifica se o nome da cidade foi fornecido. Se não, exibe uma mensagem de erro.
    if (!nomeCidade || nomeCidade.trim() === "") {
        console.error("Erro: O nome da cidade não pode ser vazio.");
        resultContainer.innerHTML = `<p class="info-message">Por favor, insira o nome de uma cidade.</p>`;
        forecastContainer.innerHTML = '';
        return null;
    }

    // Limpa resultados anteriores e mostra uma mensagem de carregamento.
    resultContainer.innerHTML = `<p class="info-message">Buscando...</p>`;
    forecastContainer.innerHTML = '';

    try {
        // **2. Geocodificação: Converter nome da cidade em coordenadas (Latitude e Longitude)**
        // Monta a URL para a API de Geocodificação da Open-Meteo.
        const geoApiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nomeCidade)}&count=1&language=pt&format=json`;

        // Realiza a chamada fetch para a API de geocodificação.
        const geoResponse = await fetch(geoApiUrl);

        // Verifica se a resposta da rede foi bem-sucedida.
        if (!geoResponse.ok) {
            // Lança um erro se a resposta HTTP não for 'ok' (ex: erro 500 no servidor da API).
            throw new Error(`Erro de rede na geocodificação: ${geoResponse.statusText} (Código: ${geoResponse.status})`);
        }

        // Converte a resposta em JSON.
        const geoData = await geoResponse.json();

        // **3. Validação da Resposta da Geocodificação**
        // Verifica se a API retornou algum resultado para a cidade pesquisada.
        if (!geoData.results || geoData.results.length === 0) {
            // Lança um erro específico se a cidade não for encontrada.
            throw new Error(`Cidade "${nomeCidade}" não encontrada.`);
        }

        // Extrai as informações de latitude, longitude e o nome real da cidade (retornado pela API).
        const { latitude, longitude, name: cidadeEncontrada } = geoData.results[0];

        // **4. Busca do Clima com as Coordenadas Obtidas**
        // Monta a URL para a API de Previsão do Tempo, usando as coordenadas.
        // Adiciona &daily=... para pegar a previsão diária.
        const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;

        // Realiza a chamada fetch para a API de previsão do tempo.
        const weatherResponse = await fetch(weatherApiUrl);

        // Verifica se a resposta da rede foi bem-sucedida.
        if (!weatherResponse.ok) {
            // Lança um erro se a resposta HTTP não for 'ok'.
            throw new Error(`Erro de rede na busca do clima: ${weatherResponse.statusText} (Código: ${weatherResponse.status})`);
        }

        // Converte a resposta em JSON.
        const weatherData = await weatherResponse.json();

        // **5. Formatação do Objeto de Retorno**
        // Cria um objeto com os dados formatados conforme solicitado.
        const climaFormatado = {
            cidade: cidadeEncontrada,
            temperatura: weatherData.current_weather.temperature,
            unidade: weatherData.current_weather_units.temperature,
            condicao_climatica: codigoClimaParaString(weatherData.current_weather.weathercode),
        };

        // **6. Exibição dos Resultados Atuais**
        // Atualiza o HTML com os dados do clima formatado.
        resultContainer.innerHTML = `
            <p><strong>Cidade:</strong> <span>${climaFormatado.cidade}</span></p>
            <p><strong>Temperatura:</strong> <span>${climaFormatado.temperatura}${climaFormatado.unidade}</span></p>
            <p><strong>Condição:</strong> <span>${climaFormatado.condicao_climatica}</span></p>
        `;

        // **7. Exibição da Previsão**
        if (weatherData.daily) {
            let forecastHTML = '<h3>Previsão para os próximos dias</h3>';
            const daily = weatherData.daily;
            
            // Loop pelos próximos 5 dias (ignorando o índice 0 que é hoje, se quisermos, mas a API retorna hoje no 0)
            // Vamos mostrar os próximos 3 dias após hoje, ou incluir hoje. Vamos incluir hoje e os próximos 4.
            for (let i = 0; i < 5; i++) {
                const date = daily.time[i];
                const maxTemp = daily.temperature_2m_max[i];
                const minTemp = daily.temperature_2m_min[i];
                const weatherCode = daily.weathercode[i];
                const weatherDesc = codigoClimaParaString(weatherCode);

                forecastHTML += `
                    <div class="forecast-day">
                        <div class="date">${formatarData(date)}</div>
                        <div class="temp">Min: ${minTemp}°C | Max: ${maxTemp}°C</div>
                        <div class="desc">${weatherDesc}</div>
                    </div>
                `;
            }
            forecastContainer.innerHTML = forecastHTML;
        }

        // Loga e retorna o objeto formatado.
        console.log("Dados do clima obtidos:", climaFormatado);
        return climaFormatado;

    } catch (error) {
        // **8. Tratamento Centralizado de Erros**
        // Captura qualquer erro que ocorra nos blocos try (falhas de rede, cidade não encontrada, etc.).
        console.error("Ocorreu um erro ao buscar o clima:", error.message);

        // Exibe uma mensagem de erro amigável para o usuário.
        resultContainer.innerHTML = `<p class="info-message">Erro: ${error.message}</p>`;
        forecastContainer.innerHTML = ''; // Limpa previsão antiga em caso de erro
        return null;
    }
}

// **9. Adicionando o Event Listener**
// Aguarda o DOM estar completamente carregado para adicionar os listeners e evitar erros.
document.addEventListener('DOMContentLoaded', () => {
    // Obtém referências para o botão de busca e o campo de input.
    const searchButton = document.getElementById('search-button');
    const cityInput = document.getElementById('city-input');

    // Adiciona um listener para o evento de clique no botão.
    searchButton.addEventListener('click', () => {
        // Chama a função getWeatherByCity passando o valor do campo de input.
        getWeatherByCity(cityInput.value);
    });

    // Adiciona um listener para o evento 'keydown' no campo de input.
    // Isso permite que o usuário pressione "Enter" para buscar.
    cityInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            getWeatherByCity(cityInput.value);
        }
    });
});