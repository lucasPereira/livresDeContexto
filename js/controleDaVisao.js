'use strict';

var ControleDaVisao = {
	temporizadorDaCaixaDeMensagens: null,
	gramaticaSelecionada: "",
	
	/**
	* Função: criarGramatica
	* Descrição: cria um nova gramática vazia.
	**/
	criarGramatica: function() {
		var listaDeGramaticas = ControleDaVisao.elemento("listaDeGramaticas");
		var itemDeListaDaGramatica = document.createElement("li");
		var campoDeTextoNomeDaGramatica = document.createElement("input");
		itemDeListaDaGramatica.appendChild(campoDeTextoNomeDaGramatica);
		listaDeGramaticas.insertBefore(itemDeListaDaGramatica, listaDeGramaticas.firstChild);
		campoDeTextoNomeDaGramatica.setAttribute("value", "novaGramatica");
		campoDeTextoNomeDaGramatica.select();
		ControleDaVisao.desabilitarBotoes();
		/**
		* Função: concluirCriacao
		* Descrição: conclui a criação da gramática caso não exista uma gramática com o mesmo nome.
		**/
		var concluirCriacao = function() {
			var nomeDaGramatica = campoDeTextoNomeDaGramatica.value;
			var criou = ControleDoModelo.criarGramatica(nomeDaGramatica);
			if (!criou) {
				ControleDaVisao.mostrarMensagem("fracasso", "Já existe uma gramática com o nome <strong>" + nomeDaGramatica + "</strong>, por favor, escolha outro.");
				campoDeTextoNomeDaGramatica.select();
			} else {
				ControleDaVisao.mostrarMensagem("sucesso", "Gramática <strong>" + nomeDaGramatica + "</strong> criada.");
				ControleDaVisao.habilitarBotoes();
				ControleDaVisao.gramaticaSelecionada = nomeDaGramatica;
				ControleDaVisao.mostrarGramaticas();
			}
		};
		campoDeTextoNomeDaGramatica.onkeypress = function(evento) {
			if (evento.keyCode === 13) {
				concluirCriacao();
			}
		};
	},

	/**
	* Função: salvarGramatica
	* Descrição: salva a gramática selecionada e tenta construir a tabela de parsing.
	* Caso não consiga criar a tabela de parsing, então mostra uma mensagem informando o problema.
	**/
	salvarGramatica: function() {
		var nomeDaGramatica = ControleDaVisao.gramaticaSelecionada;
		var gramaticaFoiSalva = ControleDoModelo.salvarGramatica(nomeDaGramatica, ControleDaVisao.elemento("codigoDaGramatica").value);
		if (gramaticaFoiSalva) {
			ControleDaVisao.mostrarMensagem("sucesso", "Gramática <strong>" + nomeDaGramatica + "</strong> salva.");
			ControleDaVisao.mostrarGramatica(nomeDaGramatica);
		} else {
			ControleDaVisao.mostrarMensagem("fracasso", "Houve um erro ao salvar a gramática <strong>" + nomeDaGramatica + "</strong>. Certifique-se que a gramática foi escrita corretamente.");
		}
	},
	
	/**
	* Função: mostrarGramaticas
	* Descrição: mostra todas as gramáticas na lista de gramáticas.
	**/
	mostrarGramaticas: function() {
		var listaDeGramaticas = ControleDaVisao.elemento("listaDeGramaticas");
		listaDeGramaticas.innerHTML = "";
		var gramaticas = ControleDoModelo.fornecerGramaticas();
		gramaticas.paraCada(function(gramatica, nomeDaGramatica) {
			var itemDeListaDaGramatica = document.createElement("li");
			itemDeListaDaGramatica.setAttribute("id", nomeDaGramatica);
			itemDeListaDaGramatica.innerHTML = nomeDaGramatica;
			/**
			* Função: selecionarGramatica
			* Descrição: tratador de envento para selecionar uma determinada gramática.
			**/
			var selecionarGramatica = function() {
				ControleDaVisao.mostrarGramatica(nomeDaGramatica);
			};
			itemDeListaDaGramatica.onclick = selecionarGramatica;
			listaDeGramaticas.insertBefore(itemDeListaDaGramatica, listaDeGramaticas.firstChild);
		});
		ControleDaVisao.mostrarGramatica(ControleDaVisao.gramaticaSelecionada);
	},
	
	/**
	* Função: mostrarGramatica
	* Parâmetros:
	* - nomeDaGramatica: nome da gramática que será mostrada.
	* Descrição: mostra a gramática e seus detalhes.
	**/
	mostrarGramatica: function(nomeDaGramatica) {
		var itemDeListaDaGramaticaAntiga = ControleDaVisao.elemento(ControleDaVisao.gramaticaSelecionada);
		if (!Utilitarios.nuloOuIndefinido(itemDeListaDaGramaticaAntiga)) {
			itemDeListaDaGramaticaAntiga.setAttribute("class", "");
		}
		var itemDeListaDaGramatica = ControleDaVisao.elemento(nomeDaGramatica);
		if (Utilitarios.nuloOuIndefinido(itemDeListaDaGramatica)) {
			itemDeListaDaGramatica = ControleDaVisao.elemento("listaDeGramaticas").firstChild;
		}
		if (!Utilitarios.nuloOuIndefinido(itemDeListaDaGramatica)) {
			itemDeListaDaGramatica.setAttribute("class", "selecionado");
			var gramatica = ControleDoModelo.fornecerGramaticas()[nomeDaGramatica];
			ControleDaVisao.gramaticaSelecionada = itemDeListaDaGramatica.innerHTML;
			ControleDaVisao.elemento("codigoDaGramatica").setAttribute("value", gramatica.fornecerCodigo());
			ControleDaVisao.elemento("codigoDaGramatica").value = gramatica.fornecerCodigo();
			ControleDaVisao.mostrarFirsts(gramatica);
			ControleDaVisao.mostrarFollows(gramatica);
			ControleDaVisao.mostrarDetalhesDaGramatica(gramatica);
		}
	},
	
	/**
	* Função: mostrarDetalhesDaGramatica
	* Parâmetros:
	* - gramatica: gramática com os detalhes que serão mostrados.
	* Descrição: mostra os detalhes da gramática.
	**/
	mostrarDetalhesDaGramatica: function(gramatica) {
		var mensagemFatorada = (gramatica.fatorada) ? "Sim" : "Não";
		var mensagemRecursivaAEsquerda = (gramatica.recursivaAEsquerda) ? "Sim" : "Não";
		var mensagemInterseccaoDosFirstsEFollowsVazia = (gramatica.interseccaoDosFirstsEFollowsVazia) ? "Sim" : "Não";
		ControleDaVisao.elemento("gramaticaFatorada").innerHTML = mensagemFatorada;
		ControleDaVisao.elemento("gramaticaComRecursaoAEsquerda").innerHTML = mensagemRecursivaAEsquerda;
		ControleDaVisao.elemento("gramaticaFirstInterseccaoFollowVazia").innerHTML = mensagemInterseccaoDosFirstsEFollowsVazia;
	},
	
	/**
	* Função: mostrarFirsts
	* Parâmetros:
	* - gramatica: gramática que possui os firts que serão mostrados.
	* Descrição: mostra os frists da gramática.
	**/
	mostrarFirsts: function(gramatica) {
		var listaDeFirsts = ControleDaVisao.elemento("listaDeFirsts");
		listaDeFirsts.innerHTML = "";
		var firsts = gramatica.fornecerFirsts();
		firsts.paraCada(function(firstsDoSimbolo, chaveDoSimbolo) {
			var tituloSimbolo = document.createElement("dt");
			var descricaoFirsts = document.createElement("dd");
			tituloSimbolo.innerHTML = chaveDoSimbolo;
			var firstsComoTexto = "";
			firstsDoSimbolo.paraCada(function(simboloFirst, chaveDoSimboloFirst) {
				firstsComoTexto += ("<strong>" + chaveDoSimboloFirst + "</strong>" + ", ");
			});
			firstsComoTexto = "{ " + firstsComoTexto.substring(0, firstsComoTexto.length - 2) + " }";
			descricaoFirsts.innerHTML = firstsComoTexto;
			listaDeFirsts.appendChild(tituloSimbolo);
			listaDeFirsts.appendChild(descricaoFirsts);
		});
	},
	
	/**
	* Função: mostrarFollows
	* Parâmetros:
	* - gramatica: gramática que possui os follows que serão mostrados.
	* Descrição: mostra os follows da gramática.
	**/
	mostrarFollows: function(gramatica) {
		var listaDeFollows = ControleDaVisao.elemento("listaDeFollows");
		listaDeFollows.innerHTML = "";
		var follows = gramatica.fornecerFollows();
		follows.paraCada(function(followsDoSimbolo, chaveDoSimbolo) {
			var tituloSimbolo = document.createElement("dt");
			var descricaoFollows = document.createElement("dd");
			tituloSimbolo.innerHTML = chaveDoSimbolo;
			var followsComoTexto = "";
			followsDoSimbolo.paraCada(function(simboloFollow, chaveDoSimboloFollow) {
				followsComoTexto += ("<strong>" + chaveDoSimboloFollow + "</strong>" + ", ");
			});
			followsComoTexto = "{ " + followsComoTexto.substring(0, followsComoTexto.length - 2) + " }";
			descricaoFollows.innerHTML = followsComoTexto;
			listaDeFollows.appendChild(tituloSimbolo);
			listaDeFollows.appendChild(descricaoFollows);
		});
	},
	
	/**
	* Função: desabilitarBotoes
	* Descrição: desabilita os botões da interface gráfica.
	**/
	desabilitarBotoes: function() {
		ControleDaVisao.elemento("botaoCriarGramatica").setAttribute("disabled", "disabled");
		ControleDaVisao.elemento("botaoSalvarGramatica").setAttribute("disabled", "disabled");
		ControleDaVisao.elemento("botaoExcluirGramatica").setAttribute("disabled", "disabled");
		ControleDaVisao.elemento("botaoReconhecerGramatica").setAttribute("disabled", "disabled");
	},
	
	/**
	* Função: habilitarBotoes
	* Descrição: habilita os botões da interface gráfica.
	**/
	habilitarBotoes: function() {
		ControleDaVisao.elemento("botaoCriarGramatica").removeAttribute("disabled");
		ControleDaVisao.elemento("botaoSalvarGramatica").removeAttribute("disabled");
		ControleDaVisao.elemento("botaoExcluirGramatica").removeAttribute("disabled");
		ControleDaVisao.elemento("botaoReconhecerGramatica").removeAttribute("disabled");
	},
	
	/**
	* Função: mostrarMensagem
	* Parâmetros:
	* - tipoDeMensagem: tipo da mensagem a ser mostrada.
	* - mensagem: texto da mensagem a ser mostrada.
	* Descrição: mostra na tela a mensagem especificada pelo parâmetro mensagem.
	**/
	mostrarMensagem: function(tipoDeMensagem, mensagem) {
		var caixaDeMensagens = ControleDaVisao.elemento("caixaDeMensagens");
		window.clearTimeout(ControleDaVisao.temporizadorDaCaixaDeMensagens);
		ControleDaVisao.temporizadorDaCaixaDeMensagens = window.setTimeout(ControleDaVisao.limparMensagem, 8000);
		caixaDeMensagens.setAttribute("class", tipoDeMensagem);
		caixaDeMensagens.innerHTML = mensagem;
		caixaDeMensagens.scrollIntoView();
	},

	/**
	* Função: limparMensagem
	* Descrição: limpa o campo de exibição de mensagens.
	**/
	limparMensagem: function() {
		ControleDaVisao.elemento("caixaDeMensagens").setAttribute("class", "");
		window.clearTimeout(ControleDaVisao.temporizadorDaCaixaDeMensagens);
	},
	
	/**
	* Função: elemento
	* Descrição: fornecer o elemento dado o seu identificador.
	**/
	elemento: function(identificador) {
		return document.getElementById(identificador);
	},
	
	/**
	* Função: adicionarTratadores
	* Descrição: adiciona os tratadores para os eventos que serão disparados em decorrência da interação do usuário.
	**/
	adicionarTratadores: function() {
		ControleDaVisao.elemento("botaoSalvarGramatica").onclick = ControleDaVisao.salvarGramatica;
		ControleDaVisao.elemento("botaoCriarGramatica").onclick = ControleDaVisao.criarGramatica;
		ControleDaVisao.elemento("caixaDeMensagens").onclick = ControleDaVisao.limparMensagem;
		if (ControleDoModelo.criarGramatica("minhaGramatica")) {
			ControleDaVisao.gramaticaSelecionada = "minhaGramatica";
			ControleDaVisao.mostrarGramaticas();
		}
	},
};