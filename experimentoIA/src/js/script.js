// Aguarda o conteúdo do DOM ser totalmente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    // Obtém os elementos do DOM onde os dados do clima serão exibidos
    const localizacaoElement = document.getElementById('localizacao');
    const temperaturaElement = document.getElementById('temperatura');
    const climaDescricaoElement = document.getElementById('clima-descricao');

    // Define a localização padrão: São Paulo, Brasil
    const latitude = -23.5505;
    const longitude = -46.6333;
    const cidade = "São Paulo"; // Nome da cidade para exibição

    // Função para converter o código do clima (WMO) em uma string descritiva
    const codigoClimaParaString = (codigo) => {
        switch (codigo) {
            case 0: return "Céu limpo";
            case 1:
            case 2:
            case 3: return "Principalmente limpo, parcialmente nublado ou encoberto";
            case 45:
            case 48: return "Nevoeiro e nevoeiro depositando rima";
            case 51:
            case 53:
            case 55: return "Garoa: Leve, moderada e de intensidade densa";
            case 56:
            case 57: return "Garoa Congelante: Leve e de intensidade densa";
            case 61:
            case 63:
            case 65: return "Chuva: Leve, moderada e de forte intensidade";
            case 66:
            case 67: return "Chuva Congelante: Leve e de forte intensidade";
            case 71:
            case 73:
            case 75: return "Queda de neve: Leve, moderada e de forte intensidade";
            case 77: return "Grãos de neve";
            case 80:
            case 81:
            case 82: return "Pancadas de chuva: Leves, moderadas e violentas";
            case 85:
            case 86: return "Pancadas de neve: Leves e fortes";
            case 95: return "Trovoada: Leve ou moderada";
            case 96:
            case 99: return "Trovoada com granizo leve e forte";
            default: return "Não disponível";
        }
    };

    // Função assíncrona para buscar os dados do clima da API
    const buscarDadosDoClima = async () => {
        try {
            // Constrói a URL da API com a latitude, longitude e os parâmetros desejados
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`);
            
            // Verifica se a resposta da requisição foi bem-sucedida
            if (!response.ok) {
                throw new Error(`Erro HTTP! status: ${response.status}`);
            }
            // Converte a resposta para JSON
            const data = await response.json();

            // Extrai a temperatura, o código do clima e a unidade da resposta
            const temperatura = data.current.temperature_2m;
            const codigoClima = data.current.weather_code;
            const unidade = data.current_units.temperature_2m;

            // Atualiza o conteúdo dos elementos no DOM com os dados obtidos
            localizacaoElement.textContent = cidade;
            temperaturaElement.textContent = `${temperatura}${unidade}`;
            climaDescricaoElement.textContent = codigoClimaParaString(codigoClima);

        } catch (error) {
            // Em caso de erro, exibe uma mensagem no console e nos elementos do DOM
            console.error("Erro ao buscar dados do clima:", error);
            localizacaoElement.textContent = "Erro";
            temperaturaElement.textContent = "Erro";
            climaDescricaoElement.textContent = "Erro";
        }
    };

    // Chama a função para buscar os dados do clima ao carregar a página
    buscarDadosDoClima();
});
