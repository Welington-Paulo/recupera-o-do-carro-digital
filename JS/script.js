// Manutencao.js
class Manutencao {
    constructor(data, tipo, custo, descricao = '') {
        if (!this.validarData(data)) {
            throw new Error("Data inválida.");
        }
        if (typeof tipo !== 'string' || tipo.trim() === '') {
            throw new Error("Tipo de manutenção inválido ou vazio.");
        }
        if (typeof custo !== 'number' || custo < 0) {
            throw new Error("Custo inválido. Deve ser um número não negativo.");
        }

        this.data = new Date(data); // Garante que seja um objeto Date
        this.tipo = tipo.trim();
        this.custo = custo;
        this.descricao = descricao.trim();
        this.id = Date.now() + Math.random().toString(16).slice(2); // ID único simples
    }

    validarData(dataInput) {
        const dataObj = new Date(dataInput);
        // Verifica se a conversão resultou em uma data válida e se não é NaN
        return dataObj instanceof Date && !isNaN(dataObj);
    }

    formatar() {
        const custoFormatado = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const dataFormatada = this.data.toLocaleDateString('pt-BR');
        let str = `${this.tipo} em ${dataFormatada}`;
        if (this.custo > 0) {
             str += ` - ${custoFormatado}`;
        }
        if (this.descricao) {
            str += ` (${this.descricao})`;
        }
        // Adiciona hora se for um agendamento futuro (opcional, mas útil)
        if (this.data > new Date()) {
             const horaFormatada = this.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
             str += ` às ${horaFormatada}`;
        }
        return str;
    }

    // Método para facilitar a serialização JSON (converte Date para string ISO)
    toJSON() {
        return {
            id: this.id,
            data: this.data.toISOString(), // Salva data como string ISO
            tipo: this.tipo,
            custo: this.custo,
            descricao: this.descricao
        };
    }

    // Método estático para recriar instância a partir de dados JSON
    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        try {
            // Recria o objeto Manutencao, convertendo a string ISO de volta para Date
            const manutencao = new Manutencao(
                new Date(json.data), // Converte string ISO para Date
                json.tipo,
                json.custo,
                json.descricao || ''
            );
            manutencao.id = json.id || Date.now() + Math.random().toString(16).slice(2); // Garante ID
            return manutencao;
        } catch (error) {
            console.error("Erro ao recriar Manutencao a partir de JSON:", error, json);
            return null; // Retorna null se houver erro na recriação
        }
    }
}



// Veiculo.js

// Assume que Manutencao.js já foi carregado
// Se não usar módulos ES6, garanta a ordem de carregamento no HTML

class Veiculo {
    constructor(id, marca, modelo, ano, cor, status = "Disponível") {
        if (!id || !marca || !modelo || !ano || !cor) {
            throw new Error("ID, Marca, Modelo, Ano e Cor são obrigatórios.");
        }
        this.id = id; // Usaremos a placa ou um ID único
        this.marca = marca;
        this.modelo = modelo;
        this.ano = ano;
        this.cor = cor;
        this.status = status; // Ex: Disponível, Em Manutenção, Alugado
        this.historicoManutencao = []; // Array para objetos Manutencao
        this._tipoVeiculo = 'Veiculo'; // Identificador para recriação do LocalStorage
    }

    adicionarManutencao(manutencao) {
        if (!(manutencao instanceof Manutencao)) {
            console.error("Objeto inválido. Apenas instâncias de Manutencao podem ser adicionadas.");
            return false;
        }
        this.historicoManutencao.push(manutencao);
        // Ordena por data (mais recentes primeiro) - opcional
        this.historicoManutencao.sort((a, b) => b.data - a.data);
        return true;
    }

    removerManutencao(idManutencao) {
        const index = this.historicoManutencao.findIndex(m => m.id === idManutencao);
        if (index > -1) {
            this.historicoManutencao.splice(index, 1);
            return true;
        }
        return false;
    }


    getHistoricoFormatado() {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data

        return this.historicoManutencao
            .filter(m => m.data <= hoje) // Filtra apenas manutenções passadas ou de hoje
            .map(m => m.formatar());
    }

    getAgendamentosFuturosFormatado() {
        const hoje = new Date();
         hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data

        return this.historicoManutencao
            .filter(m => m.data > hoje) // Filtra apenas manutenções futuras
            .map(m => m.formatar());
    }

    getInfoDetalhada() {
         return `ID: ${this.id}, Marca: ${this.marca}, Modelo: ${this.modelo}, Ano: ${this.ano}, Cor: ${this.cor}, Status: ${this.status}`;
    }

    // Método para facilitar a serialização JSON
    toJSON() {
        return {
            _tipoVeiculo: this._tipoVeiculo, // Guarda o tipo para recriar a instância correta
            id: this.id,
            marca: this.marca,
            modelo: this.modelo,
            ano: this.ano,
            cor: this.cor,
            status: this.status,
            // Serializa cada objeto Manutencao no histórico
            historicoManutencao: this.historicoManutencao.map(m => m.toJSON())
        };
    }

     // Método estático para recriar instância a partir de dados JSON
     // Precisa ser sobrescrito nas subclasses se tiverem atributos específicos
     static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        try {
            const veiculo = new Veiculo(
                json.id,
                json.marca,
                json.modelo,
                json.ano,
                json.cor,
                json.status || "Disponível"
            );
            // Recria os objetos Manutencao
            if (json.historicoManutencao && Array.isArray(json.historicoManutencao)) {
                veiculo.historicoManutencao = json.historicoManutencao
                    .map(mJson => Manutencao.fromJSON(mJson))
                    .filter(m => m !== null); // Remove nulos se a recriação falhar
                // Reordena após carregar
                 veiculo.historicoManutencao.sort((a, b) => b.data - a.data);
            }
            return veiculo;
        } catch (error) {
            console.error("Erro ao recriar Veiculo a partir de JSON:", error, json);
            return null;
        }
    }
}

class Carro extends Veiculo {
    constructor(id, marca, modelo, ano, cor, numeroPortas, status = "Disponível") {
        super(id, marca, modelo, ano, cor, status);
        this.numeroPortas = numeroPortas;
        this._tipoVeiculo = 'Carro'; // Identificador específico
    }

    getInfoDetalhada() {
        return `${super.getInfoDetalhada()}, Portas: ${this.numeroPortas}`;
    }

    toJSON() {
        // Pega o JSON da classe pai e adiciona atributos específicos
        const json = super.toJSON();
        json.numeroPortas = this.numeroPortas;
        return json;
    }

     static fromJSON(json) {
        if (!json || typeof json !== 'object' || json._tipoVeiculo !== 'Carro') return null;
         try {
            const carro = new Carro(
                json.id,
                json.marca,
                json.modelo,
                json.ano,
                json.cor,
                json.numeroPortas,
                json.status || "Disponível"
            );
             // Recria os objetos Manutencao (reutiliza lógica da classe pai ou reimplementa)
            if (json.historicoManutencao && Array.isArray(json.historicoManutencao)) {
                carro.historicoManutencao = json.historicoManutencao
                    .map(mJson => Manutencao.fromJSON(mJson))
                    .filter(m => m !== null);
                 carro.historicoManutencao.sort((a, b) => b.data - a.data);
            }
            return carro;
        } catch (error) {
            console.error("Erro ao recriar Carro a partir de JSON:", error, json);
            return null;
        }
    }
}

class CarroEsportivo extends Carro {
    constructor(id, marca, modelo, ano, cor, numeroPortas, velocidadeMaxima, status = "Disponível") {
        super(id, marca, modelo, ano, cor, numeroPortas, status);
        this.velocidadeMaxima = velocidadeMaxima;
         this._tipoVeiculo = 'CarroEsportivo';
    }

    getInfoDetalhada() {
        return `${super.getInfoDetalhada()}, Vel. Máxima: ${this.velocidadeMaxima} km/h`;
    }

    toJSON() {
        const json = super.toJSON();
        json.velocidadeMaxima = this.velocidadeMaxima;
        return json;
    }

     static fromJSON(json) {
        if (!json || typeof json !== 'object' || json._tipoVeiculo !== 'CarroEsportivo') return null;
         try {
             const esportivo = new CarroEsportivo(
                json.id,
                json.marca,
                json.modelo,
                json.ano,
                json.cor,
                json.numeroPortas,
                json.velocidadeMaxima,
                json.status || "Disponível"
            );
             if (json.historicoManutencao && Array.isArray(json.historicoManutencao)) {
                esportivo.historicoManutencao = json.historicoManutencao
                    .map(mJson => Manutencao.fromJSON(mJson))
                    .filter(m => m !== null);
                 esportivo.historicoManutencao.sort((a, b) => b.data - a.data);
            }
            return esportivo;
        } catch (error) {
            console.error("Erro ao recriar CarroEsportivo a partir de JSON:", error, json);
            return null;
        }
    }
}

class Caminhao extends Veiculo {
    constructor(id, marca, modelo, ano, cor, capacidadeCarga, numeroEixos, status = "Disponível") {
        super(id, marca, modelo, ano, cor, status);
        this.capacidadeCarga = capacidadeCarga;
        this.numeroEixos = numeroEixos;
         this._tipoVeiculo = 'Caminhao';
    }

    getInfoDetalhada() {
        return `${super.getInfoDetalhada()}, Carga: ${this.capacidadeCarga} Ton, Eixos: ${this.numeroEixos}`;
    }

     toJSON() {
        const json = super.toJSON();
        json.capacidadeCarga = this.capacidadeCarga;
        json.numeroEixos = this.numeroEixos;
        return json;
    }

     static fromJSON(json) {
        if (!json || typeof json !== 'object' || json._tipoVeiculo !== 'Caminhao') return null;
         try {
            const caminhao = new Caminhao(
                json.id,
                json.marca,
                json.modelo,
                json.ano,
                json.cor,
                json.capacidadeCarga,
                json.numeroEixos,
                json.status || "Disponível"
            );
             if (json.historicoManutencao && Array.isArray(json.historicoManutencao)) {
                caminhao.historicoManutencao = json.historicoManutencao
                    .map(mJson => Manutencao.fromJSON(mJson))
                    .filter(m => m !== null);
                 caminhao.historicoManutencao.sort((a, b) => b.data - a.data);
            }
            return caminhao;
        } catch (error) {
            console.error("Erro ao recriar Caminhao a partir de JSON:", error, json);
            return null;
        }
    }
}

// Garagem.js
// Assume que as classes de Veiculo já foram carregadas

class Garagem {
    constructor(capacidadeMaxima = 10) {
        this.veiculos = []; // Array para instâncias de Veiculo
        this.capacidadeMaxima = capacidadeMaxima;
        this._localStorageKey = 'garagemInteligenteDados'; // Chave para LocalStorage
    }

    adicionarVeiculo(veiculo) {
        if (!(veiculo instanceof Veiculo)) {
            console.error("Apenas instâncias de Veiculo podem ser adicionadas.");
            return false;
        }
        if (this.veiculos.length >= this.capacidadeMaxima) {
            alert("Garagem cheia!");
            return false;
        }
         if (this.veiculos.some(v => v.id === veiculo.id)) {
             alert(`Veículo com ID ${veiculo.id} já existe na garagem.`);
             return false;
         }
        this.veiculos.push(veiculo);
        this.salvarDados(); // Salva no LocalStorage
        return true;
    }

    removerVeiculo(idVeiculo) {
        const index = this.veiculos.findIndex(v => v.id === idVeiculo);
        if (index > -1) {
            this.veiculos.splice(index, 1);
            this.salvarDados(); // Salva no LocalStorage
            return true;
        }
        return false;
    }

    buscarVeiculo(idVeiculo) {
        return this.veiculos.find(v => v.id === idVeiculo);
    }

    listarVeiculos() {
        return this.veiculos;
    }

    // --- Persistência LocalStorage ---

    salvarDados() {
        try {
            // Mapeia os veículos para seus equivalentes JSON usando o método toJSON()
            const dadosParaSalvar = this.veiculos.map(veiculo => veiculo.toJSON());
            localStorage.setItem(this._localStorageKey, JSON.stringify(dadosParaSalvar));
            console.log("Dados da garagem salvos no LocalStorage.");
        } catch (error) {
            console.error("Erro ao salvar dados no LocalStorage:", error);
            alert("Erro ao salvar dados. Verifique o console para detalhes.");
        }
    }

    carregarDados() {
        try {
            const dadosSalvos = localStorage.getItem(this._localStorageKey);
            if (dadosSalvos) {
                const dadosParseados = JSON.parse(dadosSalvos);
                this.veiculos = dadosParseados.map(veiculoJson => {
                    // Determina qual classe instanciar baseado no _tipoVeiculo
                    switch (veiculoJson._tipoVeiculo) {
                        case 'Carro':
                            return Carro.fromJSON(veiculoJson);
                        case 'CarroEsportivo':
                            return CarroEsportivo.fromJSON(veiculoJson);
                        case 'Caminhao':
                            return Caminhao.fromJSON(veiculoJson);
                        case 'Veiculo': // Caso base
                            return Veiculo.fromJSON(veiculoJson);
                        default:
                            console.warn("Tipo de veículo desconhecido encontrado:", veiculoJson._tipoVeiculo, veiculoJson);
                            return null; // Ignora tipos desconhecidos
                    }
                }).filter(v => v !== null); // Remove veículos que falharam na recriação

                console.log("Dados da garagem carregados do LocalStorage.");
            } else {
                console.log("Nenhum dado salvo encontrado no LocalStorage.");
                this.veiculos = []; // Garante que começa vazio se não houver dados
            }
        } catch (error) {
            console.error("Erro ao carregar dados do LocalStorage:", error);
            alert("Erro ao carregar dados salvos. Os dados podem estar corrompidos. Verifique o console.");
            this.veiculos = []; // Reseta em caso de erro grave de parse
            localStorage.removeItem(this._localStorageKey); // Limpa dados corrompidos
        }
    }

    // Método para adicionar manutenção a um veículo específico
    adicionarManutencaoVeiculo(idVeiculo, manutencao) {
        const veiculo = this.buscarVeiculo(idVeiculo);
        if (veiculo) {
            const sucesso = veiculo.adicionarManutencao(manutencao);
            if (sucesso) {
                this.salvarDados(); // Salva após adicionar manutenção
            }
            return sucesso;
        }
        return false;
    }

     // Método para remover manutenção de um veículo específico
    removerManutencaoVeiculo(idVeiculo, idManutencao) {
        const veiculo = this.buscarVeiculo(idVeiculo);
        if (veiculo) {
            const sucesso = veiculo.removerManutencao(idManutencao);
            if (sucesso) {
                this.salvarDados(); // Salva após remover manutenção
            }
            return sucesso;
        }
        return false;
    }

    verificarAgendamentosProximos(diasAntecedencia = 7) {
        const hoje = new Date();
        const dataLimite = new Date();
        dataLimite.setDate(hoje.getDate() + diasAntecedencia);
        hoje.setHours(0, 0, 0, 0); // Ignora hora atual para comparação

        const agendamentos = [];
        this.veiculos.forEach(veiculo => {
            veiculo.historicoManutencao.forEach(manutencao => {
                 // Verifica se a data da manutenção está no futuro e dentro do período de antecedência
                if (manutencao.data > hoje && manutencao.data <= dataLimite) {
                    agendamentos.push({
                        veiculoInfo: `${veiculo.marca} ${veiculo.modelo} (ID: ${veiculo.id})`,
                        manutencaoInfo: manutencao.formatar()
                    });
                }
            });
        });
        return agendamentos;
    }
}


// script.js

// script.js

document.addEventListener('DOMContentLoaded', () => {
    const garagem = new Garagem('garagemInteligenteProDados'); // Usa uma nova chave ou a mesma
    const notificacoesDiv = document.getElementById('notificacoes');
    const mainContent = document.getElementById('main-content');

    // --- Funções de Notificação e Limpeza (Mantidas da versão anterior) ---
    function mostrarNotificacao(mensagem, tipo = 'info', duracao = 5000) {
        notificacoesDiv.innerHTML = mensagem; // Usa innerHTML para permitir <br> etc.
        notificacoesDiv.className = `notificacoes-area notificacao-${tipo}`;
        notificacoesDiv.style.display = 'block';
        // Scroll para a notificação ser visível (opcional)
        // notificacoesDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            notificacoesDiv.style.display = 'none';
        }, duracao);
    }

    function limparFormulario(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            if (formId === 'form-add-veiculo') {
                atualizarCamposEspecificos(); // Resetar campos condicionais
            }
             // Se o formulário de manutenção estiver dentro de um veículo específico,
             // pode precisar de lógica adicional para resetar se não tiver ID fixo.
             // Neste exemplo, os IDs são dinâmicos, então o reset funciona.
        }
    }

    // --- Lógica de Navegação por Abas ---
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);

            // Remove 'active' de todos
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Adiciona 'active' ao clicado e seu conteúdo
            tab.classList.add('active');
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Recarrega dados relevantes para a aba (opcional, mas bom para agendamentos)
            if (targetId === 'tab-agendamentos') {
                renderizarAgendamentosGeral();
            }
            if (targetId === 'tab-garagem') {
                 // A garagem é renderizada na inicialização e após ações,
                 // talvez não precise re-renderizar a cada clique na aba,
                 // a menos que haja alterações externas.
                 // renderizarGaragem();
            }
        });
    });

    // --- Funções de Renderização ---

    // Renderiza a lista de veículos na aba "Garagem"
    function renderizarGaragem() {
        const listaVeiculosDiv = document.getElementById('lista-veiculos');
        listaVeiculosDiv.innerHTML = ''; // Limpa a lista

        const veiculos = garagem.listarVeiculos();

        if (veiculos.length === 0) {
            listaVeiculosDiv.innerHTML = '<p>Nenhum veículo na garagem. Adicione um na aba "Adicionar Veículo".</p>';
            return;
        }

        veiculos.forEach(veiculo => {
            const veiculoItem = document.createElement('div');
            veiculoItem.classList.add('veiculo-item', 'card'); // Usar classe card para estilo
            veiculoItem.setAttribute('data-veiculo-id', veiculo.id);

            // Cabeçalho clicável para expandir/recolher
            const headerDiv = document.createElement('div');
             headerDiv.classList.add('veiculo-header'); // Classe para possível estilização/evento
             headerDiv.innerHTML = `
                <h3>${veiculo.marca} ${veiculo.modelo} (${veiculo.ano}) - ID: ${veiculo.id}</h3>
                <p><i>Clique para ver detalhes e manutenções</i></p>
             `;
             headerDiv.style.cursor = 'pointer'; // Indica clicável
             veiculoItem.appendChild(headerDiv);


            // Área de Detalhes (inicialmente oculta)
            const detalhesDiv = document.createElement('div');
            detalhesDiv.classList.add('veiculo-detalhes');
            detalhesDiv.innerHTML = `
                <p><strong>Tipo:</strong> ${veiculo._tipoVeiculo} | <strong>Status:</strong> ${veiculo.status}</p>
                <p>${veiculo.getInfoDetalhada()}</p>
                <button class="remover-btn" data-id="${veiculo.id}">Remover Veículo</button>
                <hr>

                <h4>Histórico de Manutenção (Passado/Hoje)</h4>
                <ul class="lista-manutencao historico"></ul>

                <h4>Agendamentos Futuros</h4>
                <ul class="lista-manutencao agendamentos"></ul>

                <form class="form-manutencao" id="form-manutencao-${veiculo.id}">
                     <h4>Registrar/Agendar Manutenção</h4>
                     <label for="manutencao-data-${veiculo.id}">Data:</label>
                     <input type="date" id="manutencao-data-${veiculo.id}" required>

                     <label for="manutencao-hora-${veiculo.id}">Hora (Opcional para agendamento):</label>
                     <input type="time" id="manutencao-hora-${veiculo.id}">

                     <label for="manutencao-tipo-${veiculo.id}">Tipo de Serviço:</label>
                     <input type="text" id="manutencao-tipo-${veiculo.id}" required placeholder="Ex: Troca de óleo">

                     <label for="manutencao-custo-${veiculo.id}">Custo (R$):</label>
                     <input type="number" id="manutencao-custo-${veiculo.id}" min="0" step="0.01" value="0" required>

                     <label for="manutencao-desc-${veiculo.id}">Descrição (Opcional):</label>
                     <textarea id="manutencao-desc-${veiculo.id}"></textarea>

                     <button type="submit">Salvar Manutenção</button>
                </form>
            `;
            veiculoItem.appendChild(detalhesDiv);
            listaVeiculosDiv.appendChild(veiculoItem);

             // Adiciona o listener para expandir/recolher
            headerDiv.addEventListener('click', () => {
                 veiculoItem.classList.toggle('expanded');
                 // Atualiza as listas de manutenção apenas quando expande (ou sempre se preferir)
                 if (veiculoItem.classList.contains('expanded')) {
                      renderizarListasManutencao(veiculo, detalhesDiv);
                 }
            });

             // Adiciona listeners DELEGADOS para botões dentro dos detalhes
             detalhesDiv.addEventListener('click', (e) => {
                  if (e.target.classList.contains('remover-btn')) {
                       const veiculoId = e.target.getAttribute('data-id');
                       handleRemoverVeiculo(veiculoId);
                  }
                   if (e.target.classList.contains('remover-manutencao-btn')) {
                        const manutencaoId = e.target.getAttribute('data-manutencao-id');
                        const veiculoId = veiculoItem.getAttribute('data-veiculo-id'); // Pega do pai
                        if(veiculoId && manutencaoId) {
                           handleRemoverManutencao(veiculoId, manutencaoId);
                           // Re-renderiza as listas após remover
                            renderizarListasManutencao(veiculo, detalhesDiv);
                       }
                   }
             });

              // Adiciona listener para o form de manutenção específico
             const formManutencao = detalhesDiv.querySelector(`#form-manutencao-${veiculo.id}`);
             if (formManutencao) {
                  formManutencao.addEventListener('submit', (e) => {
                       handleAddManutencao(e, veiculo.id);
                       // Re-renderiza as listas após adicionar
                       renderizarListasManutencao(veiculo, detalhesDiv);
                  });
             }

        }); // Fim do forEach veiculo
    }

    // Função auxiliar para renderizar as listas de manutenção dentro dos detalhes do veículo
    function renderizarListasManutencao(veiculo, detalhesDiv) {
        const listaHistoricoUl = detalhesDiv.querySelector('.lista-manutencao.historico');
        const listaAgendamentosUl = detalhesDiv.querySelector('.lista-manutencao.agendamentos');
        listaHistoricoUl.innerHTML = '';
        listaAgendamentosUl.innerHTML = '';

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        let historicoCount = 0;
        let agendamentosCount = 0;

        veiculo.historicoManutencao.forEach(m => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${m.formatar()}</span>
                <button class="remover-manutencao-btn" data-manutencao-id="${m.id}" title="Remover registro">×</button>
            `;

            if (m.data <= hoje) {
                listaHistoricoUl.appendChild(li);
                historicoCount++;
            } else {
                listaAgendamentosUl.appendChild(li);
                agendamentosCount++;
            }
        });

        if (historicoCount === 0) {
            listaHistoricoUl.innerHTML = '<li>Nenhum registro de histórico encontrado.</li>';
        }
        if (agendamentosCount === 0) {
            listaAgendamentosUl.innerHTML = '<li>Nenhum agendamento futuro.</li>';
        }
    }


    // Renderiza a lista consolidada na aba "Agendamentos"
    function renderizarAgendamentosGeral() {
        const listaAgendamentosDiv = document.getElementById('lista-agendamentos-geral');
        listaAgendamentosDiv.innerHTML = ''; // Limpa

        const todosAgendamentos = [];
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        garagem.listarVeiculos().forEach(veiculo => {
            veiculo.historicoManutencao.forEach(manutencao => {
                if (manutencao.data > hoje) {
                    todosAgendamentos.push({
                        data: manutencao.data,
                        veiculoInfo: `${veiculo.marca} ${veiculo.modelo} (ID: ${veiculo.id})`,
                        manutencaoInfo: manutencao.formatar(), // Usar o formatar completo
                        manutencaoObj: manutencao, // Para referência, se necessário
                        veiculoId: veiculo.id // Para possível ação de cancelar/ver
                    });
                }
            });
        });

        // Ordena por data (mais próximo primeiro)
        todosAgendamentos.sort((a, b) => a.data - b.data);

        if (todosAgendamentos.length === 0) {
            listaAgendamentosDiv.innerHTML = '<p>Nenhum agendamento futuro encontrado para os veículos na garagem.</p>';
            return;
        }

        const ul = document.createElement('ul');
        todosAgendamentos.forEach(ag => {
            const li = document.createElement('li');
             // Usar manutencaoInfo que já tem a formatação completa
            li.innerHTML = `
                <span class="agendamento-data">${ag.data.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</span> -
                <span class="agendamento-veiculo">${ag.veiculoInfo}</span>:
                <span>${ag.manutencaoObj.tipo}</span>
                 ${ag.manutencaoObj.descricao ? `(${ag.manutencaoObj.descricao})` : ''}
                 <!-- Opcional: Botão para cancelar diretamente daqui -->
                 <!-- <button class="remover-manutencao-btn" data-manutencao-id="${ag.manutencaoObj.id}" data-veiculo-id="${ag.veiculoId}" title="Cancelar agendamento">×</button> -->
            `;
            ul.appendChild(li);
        });
        listaAgendamentosDiv.appendChild(ul);

         // Adicionar listener delegado para botões de cancelar (se incluídos acima)
         /*
         listaAgendamentosDiv.addEventListener('click', (e) => {
             if (e.target.classList.contains('remover-manutencao-btn')) {
                  const manutencaoId = e.target.getAttribute('data-manutencao-id');
                  const veiculoId = e.target.getAttribute('data-veiculo-id');
                 if(veiculoId && manutencaoId) {
                     handleRemoverManutencao(veiculoId, manutencaoId);
                 }
             }
         });
         */
    }

    // --- Manipuladores de Eventos (Handlers) ---

    // Atualizar Campos Específicos (Mantido e chamado no lugar certo)
    const selectTipoVeiculo = document.getElementById('tipo-veiculo');
    function atualizarCamposEspecificos() {
        // ... (código da função mantido como na versão anterior) ...
         const tipo = selectTipoVeiculo.value;
         document.getElementById('campos-carro').style.display = 'none';
         document.getElementById('campos-carro-esportivo').style.display = 'none';
         document.getElementById('campos-caminhao').style.display = 'none';

         const portasCarro = document.getElementById('carro-portas');
         const portasEsportivo = document.getElementById('esportivo-portas');
         const velMaxEsportivo = document.getElementById('esportivo-velmax');
         const cargaCaminhao = document.getElementById('caminhao-carga');
         const eixosCaminhao = document.getElementById('caminhao-eixos');

         portasCarro.required = false;
         portasEsportivo.required = false;
         velMaxEsportivo.required = false;
         cargaCaminhao.required = false;
         eixosCaminhao.required = false;

         if (tipo === 'Carro') {
             document.getElementById('campos-carro').style.display = 'block';
             portasCarro.required = true;
         } else if (tipo === 'CarroEsportivo') {
             document.getElementById('campos-carro-esportivo').style.display = 'block';
             portasEsportivo.required = true;
             velMaxEsportivo.required = true;
         } else if (tipo === 'Caminhao') {
             document.getElementById('campos-caminhao').style.display = 'block';
             cargaCaminhao.required = true;
             eixosCaminhao.required = true;
         }
    }
    selectTipoVeiculo.addEventListener('change', atualizarCamposEspecificos);

    // Adicionar Veículo (Formulário na aba 'Adicionar Veículo')
    const formAddVeiculo = document.getElementById('form-add-veiculo');
    formAddVeiculo.addEventListener('submit', (e) => {
        e.preventDefault();
         // ... (lógica de pegar dados e criar instância mantida da versão anterior) ...
         const tipo = selectTipoVeiculo.value;
         const idInput = document.getElementById('veiculo-id');
         const id = idInput.value.trim().toUpperCase();
         const marca = document.getElementById('veiculo-marca').value.trim();
         const modelo = document.getElementById('veiculo-modelo').value.trim();
         const ano = parseInt(document.getElementById('veiculo-ano').value);
         const cor = document.getElementById('veiculo-cor').value.trim();

         // Validações básicas
         if (!id || !marca || !modelo || isNaN(ano) || !cor) {
              mostrarNotificacao('Erro: Todos os campos básicos são obrigatórios.', 'erro');
              return;
         }
          if (garagem.buscarVeiculo(id)) {
             mostrarNotificacao(`Erro: Veículo com ID ${id} já existe na garagem.`, 'erro');
             idInput.focus(); // Foca no campo ID
             return;
         }


         try {
             let novoVeiculo;
              // Criação da instância específica (igual antes)
              if (tipo === 'Carro') {
                 const numeroPortas = parseInt(document.getElementById('carro-portas').value);
                 if (isNaN(numeroPortas) || numeroPortas <= 0) throw new Error("Número de portas inválido.");
                 novoVeiculo = new Carro(id, marca, modelo, ano, cor, numeroPortas);
             } else if (tipo === 'CarroEsportivo') {
                 // ... validação e criação de CarroEsportivo
                 const numeroPortas = parseInt(document.getElementById('esportivo-portas').value);
                  const velocidadeMaxima = parseInt(document.getElementById('esportivo-velmax').value);
                  if (isNaN(numeroPortas) || numeroPortas <= 0) throw new Error("Número de portas inválido.");
                  if (isNaN(velocidadeMaxima) || velocidadeMaxima <= 0) throw new Error("Velocidade máxima inválida.");
                 novoVeiculo = new CarroEsportivo(id, marca, modelo, ano, cor, numeroPortas, velocidadeMaxima);
             } else if (tipo === 'Caminhao') {
                 // ... validação e criação de Caminhao
                  const capacidadeCarga = parseFloat(document.getElementById('caminhao-carga').value);
                  const numeroEixos = parseInt(document.getElementById('caminhao-eixos').value);
                   if (isNaN(capacidadeCarga) || capacidadeCarga < 0) throw new Error("Capacidade de carga inválida.");
                  if (isNaN(numeroEixos) || numeroEixos <= 0) throw new Error("Número de eixos inválido.");
                 novoVeiculo = new Caminhao(id, marca, modelo, ano, cor, capacidadeCarga, numeroEixos);
             } else {
                 throw new Error("Tipo de veículo inválido selecionado.");
             }


            if (garagem.adicionarVeiculo(novoVeiculo)) {
                mostrarNotificacao(`Veículo ${marca} ${modelo} (ID: ${id}) adicionado com sucesso!`, 'sucesso');
                limparFormulario('form-add-veiculo');
                renderizarGaragem(); // Atualiza a lista na aba Garagem
                renderizarAgendamentosGeral(); // Atualiza a lista na aba Agendamentos
                verificarEAlertarAgendamentos(); // Verifica notificações

                // Opcional: Mudar para a aba Garagem após adicionar
                // document.querySelector('.tab-link[data-tab="tab-garagem"]').click();
            } else {
                 // A validação de ID duplicado agora está antes de adicionarVeiculo
                 mostrarNotificacao(`Erro desconhecido ao adicionar o veículo ${id}. Verifique o console.`, 'erro');
            }

        } catch (error) {
            console.error("Erro ao adicionar veículo:", error);
            mostrarNotificacao(`Erro: ${error.message}`, 'erro');
        }
    });

    // Adicionar Manutenção (Handler chamado pelos forms dentro dos detalhes dos veículos)
    function handleAddManutencao(event, veiculoId) {
        event.preventDefault();
        event.stopPropagation(); // Impede que o clique no botão feche os detalhes, se aplicável
        const form = event.target;

        // ... (lógica de pegar dados do form mantida da versão anterior) ...
         const dataStr = form.querySelector(`#manutencao-data-${veiculoId}`).value;
         const horaStr = form.querySelector(`#manutencao-hora-${veiculoId}`).value;
         const tipo = form.querySelector(`#manutencao-tipo-${veiculoId}`).value.trim();
         const custo = parseFloat(form.querySelector(`#manutencao-custo-${veiculoId}`).value);
         const descricao = form.querySelector(`#manutencao-desc-${veiculoId}`).value.trim();

         let dataCompletaStr = dataStr;
         if (horaStr) {
             dataCompletaStr += `T${horaStr}`;
         } else {
             dataCompletaStr += `T00:00:00`; // Default to start of day if no time
         }


        try {
             // Validações
             if (!dataStr || !tipo) throw new Error("Data e Tipo de Serviço são obrigatórios.");
             if (isNaN(custo) || custo < 0) throw new Error("Custo inválido (deve ser >= 0).");
             // A validação da data é feita no construtor de Manutencao

            const novaManutencao = new Manutencao(dataCompletaStr, tipo, custo, descricao);

            if (garagem.adicionarManutencaoVeiculo(veiculoId, novaManutencao)) {
                mostrarNotificacao(`Manutenção para ${veiculoId} salva.`, 'sucesso');
                form.reset(); // Limpa o formulário específico
                // A re-renderização das listas de manutenção é feita pela função que chama esta
                renderizarAgendamentosGeral(); // Atualiza a aba de agendamentos geral
                verificarEAlertarAgendamentos();
            } else {
                mostrarNotificacao(`Erro ao salvar manutenção para ${veiculoId}. Veículo não encontrado?`, 'erro');
            }

        } catch (error) {
            console.error("Erro ao adicionar manutenção:", error);
            mostrarNotificacao(`Erro: ${error.message}`, 'erro');
        }
    }

    // Remover Veículo (Handler chamado pelos botões dentro dos detalhes)
    function handleRemoverVeiculo(veiculoId) {
         event.stopPropagation(); // Impede que o clique no botão feche os detalhes
        if (confirm(`Tem certeza que deseja remover o veículo ${veiculoId} e todo o seu histórico? Esta ação não pode ser desfeita.`)) {
            if (garagem.removerVeiculo(veiculoId)) {
                mostrarNotificacao(`Veículo ${veiculoId} removido.`, 'sucesso');
                renderizarGaragem(); // Atualiza a aba Garagem
                renderizarAgendamentosGeral(); // Atualiza a aba Agendamentos
                verificarEAlertarAgendamentos();
            } else {
                mostrarNotificacao(`Erro ao remover veículo ${veiculoId}.`, 'erro');
            }
        }
    }

    // Remover Manutenção (Handler chamado pelos botões 'x' nas listas de manutenção)
    function handleRemoverManutencao(veiculoId, manutencaoId) {
         event.stopPropagation(); // Impede que o clique no botão feche os detalhes
        // Confirmação mais específica dependendo se é histórico ou agendamento
        const veiculo = garagem.buscarVeiculo(veiculoId);
        const manutencao = veiculo?.historicoManutencao.find(m => m.id === manutencaoId);
        let msgConfirmacao = "Tem certeza que deseja remover este registro de manutenção?";
        if (manutencao && manutencao.data > new Date()) {
            msgConfirmacao = "Tem certeza que deseja cancelar este agendamento?";
        }

        if (confirm(msgConfirmacao)) {
            if (garagem.removerManutencaoVeiculo(veiculoId, manutencaoId)) {
                mostrarNotificacao(`Registro de manutenção removido.`, 'sucesso');
                 // A re-renderização das listas de manutenção é feita pela função que chama esta
                renderizarAgendamentosGeral(); // Atualiza a aba de agendamentos geral
                verificarEAlertarAgendamentos();
            } else {
                mostrarNotificacao(`Erro ao remover registro de manutenção.`, 'erro');
            }
        }
    }


    // Verifica agendamentos próximos e mostra UMA notificação consolidada
    function verificarEAlertarAgendamentos(diasAntecedencia = 7) {
        console.log("Verificando agendamentos próximos...");
        const agendamentosProximos = garagem.verificarAgendamentosProximos(diasAntecedencia);

        if (agendamentosProximos.length > 0) {
            let mensagensHtml = [`<strong>Lembrete(s) de Manutenção (Próximos ${diasAntecedencia} dias):</strong>`];
            agendamentosProximos.forEach(ag => {
                // Formatar data/hora de forma mais explícita para o lembrete
                 // A informação já vem formatada de verificarAgendamentosProximos
                 // mas podemos ajustar se necessário
                 mensagensHtml.push(`- ${ag.veiculoInfo}: ${ag.manutencaoInfo}`);
            });
            mostrarNotificacao(mensagensHtml.join('<br>'), 'aviso', 15000); // Notificação tipo aviso, duração maior
        } else {
            console.log("Nenhum agendamento próximo encontrado.");
            // Não mostra notificação se não houver nada pendente
        }
    }


    // --- Inicialização ---
    function inicializarSistema() {
        console.log("Inicializando Sistema da Garagem Inteligente Pro...");
        try {
            garagem.carregarDados(); // Carrega dados do LocalStorage
            console.log(`Carregados ${garagem.listarVeiculos().length} veículos.`);
        } catch (error) {
            console.error("Falha crítica ao carregar dados:", error);
            mostrarNotificacao("Erro grave ao carregar dados salvos. Iniciando com garagem vazia. Verifique o console.", "erro", 10000);
            // Garante que a garagem esteja vazia se o carregamento falhar
            garagem.veiculos = [];
            // Opcional: Limpar localStorage se estiver corrompido
             // localStorage.removeItem(garagem._localStorageKey);
        }

        atualizarCamposEspecificos(); // Configura o form de add veículo
        renderizarGaragem();        // Renderiza a aba de veículos
        renderizarAgendamentosGeral(); // Renderiza a aba de agendamentos
        verificarEAlertarAgendamentos(); // Verifica lembretes

        // Define a aba "Garagem" como ativa inicialmente (caso o HTML não o faça)
        document.querySelector('.tab-link[data-tab="tab-garagem"]').click();
        console.log("Sistema pronto.");
    }

    inicializarSistema(); // Chama a função principal de inicialização

}); // Fim do DOMContentLoaded