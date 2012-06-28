"use strict";

var Gramatica = new Prototipo({
	inicializar: function(nome) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(nome, String));
		this.nome = nome;
		this.codigo = "";
		this.naoTerminais = {};
		this.terminais = {};
		this.simboloInicial = null;
		this.firsts = {};
		this.follows = {};
		this.tabelaDeParsing = {};
		this.fatorada = false;
		this.recursivaAEsquerda = false;
		this.interseccaoDosFirstsEFollowsVazia = false;
		this.adicionarTerminal("$");
	},
	
	fixarCodigo: function(codigo) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(codigo, String));
		this.codigo = codigo;
	},
	
	fornecerCodigo: function() {
		return this.codigo;
	},
	
	fornecerNome: function() {
		return this.nome;
	},
	
	fornecerFirsts: function() {
		return this.firsts;
	},
	
	fornecerFollows: function() {
		return this.follows;
	},
	
	fornecerTabelaDeParsing: function() {
		return this.tabelaDeParsing;
	},
	
	fixarSimboloInicial: function(simbolo) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(simbolo, String));
		var naoTerminal = this.naoTerminais[simbolo];
		Utilitarios.assegureQueNao(Utilitarios.nuloOuIndefinido(naoTerminal));
		this.simboloInicial = naoTerminal;
	},
	
	fornecerNaoTerminal: function(simbolo) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(simbolo, String));
		return this.naoTerminais[simbolo];
	},
	
	adicionarTerminal: function(simbolo) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(simbolo, String));
		Utilitarios.assegureQue(Utilitarios.nuloOuIndefinido(this.naoTerminais[simbolo]));
		var adicionou = false;
		if (Utilitarios.nuloOuIndefinido(this.terminais[simbolo])) {
			this.terminais[simbolo] = new Terminal(simbolo);
			adicionou = true;
		}
		return adicionou;
	},
	
	adicionarNaoTerminal: function(simbolo) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(simbolo, String));
		Utilitarios.assegureQue(Utilitarios.nuloOuIndefinido(this.terminais[simbolo]));
		var adicionou = false;
		if (Utilitarios.nuloOuIndefinido(this.naoTerminais[simbolo])) {
			var naoTerminal = new NaoTerminal(simbolo);
			this.naoTerminais[simbolo] = naoTerminal;
			if (Utilitarios.nulo(this.simboloInicial)) {
				this.simboloInicial = naoTerminal;
			}
			adicionou = true;
		}
		return adicionou;
	},
	
	adicionarProducao: function(simboloNaoTerminal, simbolosDaProducao) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(simboloNaoTerminal, String));
		Utilitarios.assegureQue(Utilitarios.instanciaDe(simbolosDaProducao, Array));
		var naoTerminal = this.naoTerminais[simboloNaoTerminal];
		Utilitarios.assegureQueNao(Utilitarios.nuloOuIndefinido(naoTerminal));
		var producao = [];
		simbolosDaProducao.paraCada(function(simbolo, indice) {
			var simboloDaProducao = this.naoTerminais[simbolo];
			if (Utilitarios.nuloOuIndefinido(simboloDaProducao)) {
				simboloDaProducao = this.terminais[simbolo];
			}
			Utilitarios.assegureQueNao(Utilitarios.nuloOuIndefinido(simboloDaProducao));
			producao.push(simboloDaProducao);
		}, this);
		if (producao.length > 0) {
			return naoTerminal.adicionarProducao(producao);
		}
		return false;
	},
	
	analisar: function() {
		this.calcularFirsts();
		this.calcularFollows();
		this.construirTabelaDeParsing();
		this.estaFatorada();
		this.possuiRecursaoAEsquerda();
		this.possuiIntersecaoDosFirstsEFollowsVaiza();
	},
	
	calcularFirsts: function() {
		var conjuntoDeFirsts = {};
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			naoTerminal.first(conjuntoDeFirsts);
		});
		this.firsts = conjuntoDeFirsts;
	},
	
	calcularFollows: function() {
		var conjuntoDeFollows = {};
		var tabelaDeFollows = {};
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			conjuntoDeFollows[simboloDoNaoTerminal] = {};
			tabelaDeFollows[simboloDoNaoTerminal] = {};
		}, this);
		conjuntoDeFollows[this.simboloInicial.simbolo]["$"] = this.terminais["$"];
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			naoTerminal.producoes.paraCada(function(producao, indiceDaProducao) {
				var indiceDoSimbolo = 0;
				while (indiceDoSimbolo < producao.length) {
					var simboloAtualNaProducao = producao[indiceDoSimbolo];
					if (++indiceDoSimbolo < producao.length && Utilitarios.instanciaDe(simboloAtualNaProducao, NaoTerminal)) {
						var proximoSimboloNaProducao = producao[indiceDoSimbolo];
						if (!proximoSimboloNaProducao.epsilon()) {
							this.firsts[proximoSimboloNaProducao.simbolo].paraCada(function(first, simboloDoFirst) {
								conjuntoDeFollows[simboloAtualNaProducao.simbolo][simboloDoFirst] = first;
							});
						}
					}
				}
			}, this);
		}, this);
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			naoTerminal.producoes.paraCada(function(producao, indiceDaProducao) {
				var encontrouUmNaoTerminalReceptor = false;
				var encontrouUmTerminal = false;
				var indiceDoSimboloDaProducao = producao.length - 1;
				while (indiceDoSimboloDaProducao >= 0 && !encontrouUmNaoTerminalReceptor && !encontrouUmTerminal) {
					var simboloDaProducao = producao[indiceDoSimboloDaProducao--];
					if (Utilitarios.instanciaDe(simboloDaProducao, Terminal)) {
						encontrouUmTerminal = true;
					} else {
						tabelaDeFollows[simboloDoNaoTerminal][simboloDaProducao.simbolo] = conjuntoDeFollows[simboloDoNaoTerminal];
						if (Utilitarios.nuloOuIndefinido(this.firsts[simboloDaProducao.simbolo]["&"])) {
							encontrouUmNaoTerminalReceptor = true;
						}
					}
				}
			}, this);
		}, this);
		tabelaDeFollows.paraCada(function(fornecedorDosFollows, simboloDoFornecedorDosFollows) {
			this.naoTerminais[simboloDoFornecedorDosFollows].follows(tabelaDeFollows, conjuntoDeFollows, this.naoTerminais);
		}, this);
		this.follows = conjuntoDeFollows;
	},
	
	construirTabelaDeParsing: function() {
		
	},
	
	estaFatorada: function() {
		return this.fatorada;
	},
	
	possuiRecursaoAEsquerda: function() {
		var possuiNaoTerminalRecursivoAEsquerda = false;
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			if (naoTerminal.possuiRecursaoAEsquerda()) {
				possuiNaoTerminalRecursivoAEsquerda = true;
				return;
			}
		});
		this.recursivaAEsquerda = possuiNaoTerminalRecursivoAEsquerda;
		return this.recursivaAEsquerda;
	},
	
	possuiIntersecaoDosFirstsEFollowsVaiza: function() {
		return this.interseccaoDosFirstsEFollowsVazia;
	}
});

var NaoTerminal = new Prototipo({
	inicializar: function(simbolo) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(simbolo, String));
		this.simbolo = simbolo;
		this.producoes = [];
	},
	
	adicionarProducao: function(simbolos) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(simbolos, Array));
		var combinou = false;
		this.producoes.paraCada(function(producao, indiceDaProducao) {
			if (simbolos.length === producao.length) {
				var combinouUmaProducao = true;
				producao.paraCada(function(simbolo, indiceDoSimbolo) {
					var simboloDaNovaProducao = simbolos[indiceDoSimbolo];
					if (simbolo !== simboloDaNovaProducao) {
						combinouUmaProducao = false;
					}
				});
				if (combinouUmaProducao) {
					combinou = true;
				}
			}
		}, this);
		if (!combinou) {
			this.producoes.push(simbolos);
		}
		return !combinou;
	},
	
	first: function(conjuntoDeFirsts, simboloReceptor) {
		var meuSimbolo = this.simbolo;
		if (Utilitarios.nuloOuIndefinido(conjuntoDeFirsts[meuSimbolo])) {
			conjuntoDeFirsts[meuSimbolo] = {};
			this.producoes.paraCada(function(producao, indiceDaProducao) {
				var indiceDoSimbolo = 0;
				var proximoSimbolo = producao[indiceDoSimbolo];
				var simboloDoProximo = null;
				var anteriorDerivaEpsilon = false;
				do {
					proximoSimbolo.first(conjuntoDeFirsts, meuSimbolo);
					simboloDoProximo = proximoSimbolo.simbolo;
					anteriorDerivaEpsilon = proximoSimbolo.derivaEpsilonEmUmPasso();
					proximoSimbolo = producao[++indiceDoSimbolo];
				} while (anteriorDerivaEpsilon && indiceDoSimbolo < producao.length);
				if (anteriorDerivaEpsilon && indiceDoSimbolo === producao.length) {
					conjuntoDeFirsts[meuSimbolo]["&"] = conjuntoDeFirsts[simboloDoProximo]["&"];
				}
			});
		}
		var receptor = conjuntoDeFirsts[simboloReceptor];
		if (!Utilitarios.nuloOuIndefinido(receptor)) {
			conjuntoDeFirsts[meuSimbolo].paraCada(function(meuFirst, chaveDoMeuFirst) {
				if (!meuFirst.epsilon()) {
					conjuntoDeFirsts[simboloReceptor][chaveDoMeuFirst] = meuFirst;
				}
			});
		}
	},
	
	follows: function(tabelaDeFollows, conjuntoDeFollows, naoTerminais, novosFollows) {
		var difusaoInicial = Utilitarios.nuloOuIndefinido(novosFollows);
		var ganhouNovosFollows = false;
		if (!difusaoInicial) {
			novosFollows.paraCada(function(novoFollow, chaveDoNovoFollow) {
				if (Utilitarios.nuloOuIndefinido(conjuntoDeFollows[this.simbolo][chaveDoNovoFollow])) {
					conjuntoDeFollows[this.simbolo][chaveDoNovoFollow] = novoFollow;
					ganhouNovosFollows = true;
				}
			}, this);
		}
		if (difusaoInicial || ganhouNovosFollows) {
			if (!Utilitarios.nuloOuIndefinido(tabelaDeFollows[this.simbolo])) {
				tabelaDeFollows[this.simbolo].paraCada(function(receptorDosFollows, simboloDoReceptorDosFollows) {
					naoTerminais[simboloDoReceptorDosFollows].follows(tabelaDeFollows, conjuntoDeFollows, naoTerminais, conjuntoDeFollows[this.simbolo]);
				}, this);
			}
		}
	},
	
	possuiRecursaoAEsquerda: function() {
		var recursivoAEsquerda = false;
		this.producoes.paraCada(function(producao, indiceDaProducao) {
			var indiceDoSimboloDaProducao = 0;
			var antecessoresDerivamEpsilon = true;
			while (indiceDoSimboloDaProducao < producao.length && antecessoresDerivamEpsilon && !recursivoAEsquerda) {
				var simboloDaProducao = producao[indiceDoSimboloDaProducao++];
				if (simboloDaProducao !== this) {
					antecessoresDerivamEpsilon = simboloDaProducao.derivaEpsilonEmZeroOuMaisPassos();
				} else {
					recursivoAEsquerda = true;
				}
			}
			if (recursivoAEsquerda) {
				return;
			}
		}, this);
		return recursivoAEsquerda;
	},
	
	derivaEpsilonEmZeroOuMaisPassos: function(origens) {
		if (Utilitarios.nuloOuIndefinido(origens)) {
			origens = {};
		}
		origens[this.simbolo] = this;
		var derivaEpsilon = false;
		this.producoes.paraCada(function(producao, indiceDaProducao) {
			var todosDerivam = true;
			producao.paraCada(function(simboloDaProducao, indiceDoSimboloDaProducao) {
				if (Utilitarios.nuloOuIndefinido(origens[simboloDaProducao.simbolo])) {
					todosDerivam = simboloDaProducao.derivaEpsilonEmZeroOuMaisPassos(origens) && todosDerivam;
				} else {
					todosDerivam = false;
				}
			});
			if (todosDerivam) {
				derivaEpsilon = true;
				return;
			}
		});
		return derivaEpsilon;
	},
	
	derivaEpsilonEmUmPasso: function() {
		var derivaEpsilon = false;
		this.producoes.paraCada(function(producao, indiceDaProducao) {
			if (producao.length === 1 && producao[0].epsilon()) {
				derivaEpsilon = true;
				return;
			}
		});
		return derivaEpsilon;
	},
	
	epsilon: function() {
		return false;
	}
});

var Terminal = new Prototipo({
	inicializar: function(simbolo) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(simbolo, String));
		this.simbolo = simbolo;
	},
	
	first: function(conjuntoDeFirsts, simboloReceptor) {
		var meuSimbolo = this.simbolo;
		if (Utilitarios.nuloOuIndefinido(conjuntoDeFirsts[meuSimbolo])) {
			var meuConjuntoDeFirsts = {};
			meuConjuntoDeFirsts[meuSimbolo] = this;
			conjuntoDeFirsts[meuSimbolo] = meuConjuntoDeFirsts;
		}
		var receptor = conjuntoDeFirsts[simboloReceptor];
		if (!Utilitarios.nuloOuIndefinido(receptor)) {
			conjuntoDeFirsts[simboloReceptor][meuSimbolo] = this;
		}
	},
	
	derivaEpsilonEmZeroOuMaisPassos: function() {
		return this.epsilon();
	},
	
	derivaEpsilonEmUmPasso: function() {
		return false;
	},
	
	epsilon: function() {
		return (this.simbolo === "&");
	}
});