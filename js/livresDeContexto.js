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
		this.recursivaAEsquerda = true;
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
	
	codigoVazio: function() {
		return this.codigo === "";
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
		this.possuiRecursaoAEsquerda();
		this.estaFatorada();
		this.possuiIntersecaoDosFirstsEFollowsVaiza();
	},
	
	calcularFirsts: function() {
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			this.firsts[simboloDoNaoTerminal] = naoTerminal.fornecerFirsts();
		}, this);
		this.terminais.paraCada(function(terminal, simboloDoTerminal) {
			this.firsts[simboloDoTerminal] = terminal.fornecerFirsts();
		}, this);
	},
	
	calcularFollows: function() {
		this.simboloInicial.adicionarFollows({"$": this.terminais["$"]});
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			naoTerminal.fornecerProducoes().paraCada(function(producao, indiceDaProducao) {
				var indiceDoSimboloDaProducao = 0;
				while (indiceDoSimboloDaProducao < producao.length) {
					var simboloAtualDaProducao = producao[indiceDoSimboloDaProducao];
					if (++indiceDoSimboloDaProducao < producao.length && Utilitarios.instanciaDe(simboloAtualDaProducao, NaoTerminal)) {
						var proximoSimboloDaProducao = producao[indiceDoSimboloDaProducao];
						if (!proximoSimboloDaProducao.epsilon()) {
							simboloAtualDaProducao.adicionarFollows(proximoSimboloDaProducao.fornecerFirsts());
						}
					}
				}
			}, this);
		}, this);
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			this.follows[simboloDoNaoTerminal] = naoTerminal.fornecerFollows();
		}, this);
	},
	
	construirTabelaDeParsing: function() {
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			this.tabelaDeParsing[simboloDoNaoTerminal] = {};
			this.terminais.paraCada(function(terminal, simboloDoTerminal) {
				if (!terminal.epsilon()) {
					this.tabelaDeParsing[simboloDoNaoTerminal][simboloDoTerminal] = [];
				}
			}, this);
		}, this);
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			naoTerminal.fornecerProducoes().paraCada(function(producao, indiceDaProducao) {
				producao[0].fornecerFirsts().paraCada(function(firstDaProducao, simboloDoFirstDaProducao) {
					if (!firstDaProducao.epsilon()) {
						this.tabelaDeParsing[simboloDoNaoTerminal][simboloDoFirstDaProducao].push(producao); 
					} else {
						naoTerminal.fornecerFollows().paraCada(function(followDoNaoTerminal, simboloDoFollowDoNaoTerminal) {
							this.tabelaDeParsing[simboloDoNaoTerminal][simboloDoFollowDoNaoTerminal].push(producao);
						}, this);
					}
				}, this);
			}, this);
		}, this);
	},
	
	estaFatorada: function() {
		this.fatorada = true;
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			if (!naoTerminal.estaFatorado()) {
				this.fatorada = false;
				return
			}
		}, this);
		return this.fatorada;
	},
	
	possuiRecursaoAEsquerda: function() {
		this.recursivaAEsquerda = false;
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			if (naoTerminal.possuiRecursaoAEsquerda()) {
				this.recursivaAEsquerda = true;
				return;
			}
		}, this);
		return this.recursivaAEsquerda;
	},
	
	possuiIntersecaoDosFirstsEFollowsVaiza: function() {
		this.interseccaoDosFirstsEFollowsVazia = true;
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			if (!naoTerminal.possuiInterseccaoDoFirstEFollowVazia()) {
				this.interseccaoDosFirstsEFollowsVazia = false;
				return;
			}
		}, this);
		return this.interseccaoDosFirstsEFollowsVazia;
	}
});

var NaoTerminal = new Prototipo({
	inicializar: function(simbolo) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(simbolo, String));
		this.simbolo = simbolo;
		this.producoes = [];
		this.firsts = null;
		this.follows = null;
		this.recursivoAEsquerda = false;
		this.receptoresDosFirsts = {};
	},
	
	fornecerProducoes: function() {
		return this.producoes;
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
			simbolos.toString = function() {
				return this.join(" ");
			};
			this.producoes.push(simbolos);
		}
		return !combinou;
	},
	
	fornecerFirsts: function() {
		if (Utilitarios.nulo(this.firsts)) {
			this.calcularFirsts(this);
		}
		return this.firsts;
	},
	
	fornecerFollows: function() {
		if (Utilitarios.nulo(this.follows)) {
			return {};
		}
		return this.follows;
	},
	
	calcularFirsts: function(receptorDosFirsts) {
		if (Utilitarios.nulo(this.firsts)) {
			this.firsts = {};
			this.producoes.paraCada(function(producao, indiceDaProducao) {
				var indiceDoSimbolo = 0;
				var proximoSimbolo = producao[indiceDoSimbolo];
				if (proximoSimbolo !== this) {
					var anteriorDerivaEpsilon = false;
					var firstsDoProximoSimbolo = {};
					do {
						firstsDoProximoSimbolo = proximoSimbolo.calcularFirsts(this);
						anteriorDerivaEpsilon = proximoSimbolo.derivaEpsilonEmUmPasso();
						firstsDoProximoSimbolo.paraCada(function(novoFirst, chaveDoNovoFirst) {
							if (!novoFirst.epsilon() || proximoSimbolo.epsilon()) {
								this.firsts[chaveDoNovoFirst] = novoFirst;
							}
						}, this);
						proximoSimbolo = producao[++indiceDoSimbolo];
					} while (anteriorDerivaEpsilon && indiceDoSimbolo < producao.length);
					if (anteriorDerivaEpsilon && indiceDoSimbolo === producao.length) {
						this.firsts["&"] = firstsDoProximoSimbolo["&"];
					}
				}
			}, this);
			this.propagarFirsts();
		} else {
			this.recursivoAEsquerda = true;
			this.receptoresDosFirsts[receptorDosFirsts.simbolo] = receptorDosFirsts;
		}
		return this.firsts;
	},

	propagarFirsts: function() {
		this.receptoresDosFirsts.paraCada(function(receptorDosFirsts, simboloDoReceptorDosFirsts) {
			receptorDosFirsts.adicionarFirsts(this.firsts);
		}, this);
	},

	adicionarFirsts: function(novosFirsts) {
		var adicionouNovosFirsts = false;
		novosFirsts.paraCada(function(novoFirst, simboloDoNovoFirst) {
			if (Utilitarios.nuloOuIndefinido(this.firsts[simboloDoNovoFirst])) {
				adicionouNovosFirsts = true;
				this.firsts[simboloDoNovoFirst] = novoFirst;
			}
		}, this);
		if (adicionouNovosFirsts) {
			this.propagarFirsts();
		}
	},
	
	propagarFollows: function() {
		this.producoes.paraCada(function(producao, indiceDaProducao) {
			var encontrouOUltimoNaoTerminalReceptor = false;
			var encontrouUmTerminal = false;
			var indiceDoSimboloDaProducao = producao.length - 1;
			while (indiceDoSimboloDaProducao >= 0 && !encontrouOUltimoNaoTerminalReceptor && !encontrouUmTerminal) {
				var simboloDaProducao = producao[indiceDoSimboloDaProducao--];
				if (Utilitarios.instanciaDe(simboloDaProducao, Terminal)) {
					encontrouUmTerminal = true;
				} else {
					simboloDaProducao.adicionarFollows(this.follows);
					if (!simboloDaProducao.derivaEpsilonEmZeroOuMaisPassos()) {
						encontrouOUltimoNaoTerminalReceptor = true;
					}
				}
			}
		}, this);
	},
	
	adicionarFollows: function(novosFollows) {
		if (Utilitarios.nulo(this.follows)) {
			this.follows = {};
		}
		var adicionouNovosFollows = false;
		novosFollows.paraCada(function(novoFollow, simboloDoNovoFollow) {
			if (Utilitarios.nuloOuIndefinido(this.follows[simboloDoNovoFollow]) && !novoFollow.epsilon()) {
				adicionouNovosFollows = true;
				this.follows[simboloDoNovoFollow] = novoFollow;
			}
		}, this);
		if (adicionouNovosFollows) {
			this.propagarFollows();
		}
	},
	
	estaFatorado: function() {
		this.fornecerFirsts();
		var firstsDasProducoes = {};
		var fatorado = true;
		this.producoes.paraCada(function(producao, indiceDaProducao) {
			producao[0].fornecerFirsts().paraCada(function(firstDaProducao, simboloDoFirstDaProducao) {
				if (Utilitarios.nuloOuIndefinido(firstsDasProducoes[simboloDoFirstDaProducao])) {
					if (!firstDaProducao.epsilon()) {
						firstsDasProducoes[simboloDoFirstDaProducao] = firstDaProducao;
					}
				} else {
					fatorado = false;
					return
				}
			});
		});
		return fatorado;
	},
	
	possuiRecursaoAEsquerda: function() {
		/*
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
					return;
				}
			}
		}, this);
		return recursivoAEsquerda;
		*/
		return this.recursivoAEsquerda;
	},
	
	possuiInterseccaoDoFirstEFollowVazia: function() {
		var interseccaoDoFirstEFollowVazia = true;
		if (this.derivaEpsilonEmZeroOuMaisPassos()) {
			this.fornecerFirsts().paraCada(function(first, simboloDoFirst) {
				if (!Utilitarios.nuloOuIndefinido(this.fornecerFollows()[simboloDoFirst])) {
					interseccaoDoFirstEFollowVazia = false;
					return;
				}
			}, this);
			this.fornecerFollows().paraCada(function(follow, simboloDoFollow) {
				if (!Utilitarios.nuloOuIndefinido(this.fornecerFirsts()[simboloDoFollow])) {
					interseccaoDoFirstEFollowVazia = false;
					return;
				}
			}, this);
		}
		return interseccaoDoFirstEFollowVazia;
	},
	
	derivaEpsilonEmZeroOuMaisPassos: function() {
		return (!Utilitarios.nuloOuIndefinido(this.fornecerFirsts()["&"]));
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
	},
	
	toString: function() {
		return this.simbolo;
	}
});

var Terminal = new Prototipo({
	inicializar: function(simbolo) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(simbolo, String));
		this.simbolo = simbolo;
	},
	
	fornecerFirsts: function() {
		return this.calcularFirsts();
	},
	
	calcularFirsts: function() {
		var firsts = {};
		firsts[this.simbolo] = this;
		return firsts;
	},
	
	derivaEpsilonEmZeroOuMaisPassos: function() {
		return this.epsilon();
	},
	
	derivaEpsilonEmUmPasso: function() {
		return false;
	},
	
	epsilon: function() {
		return (this.simbolo === "&");
	},
	
	toString: function() {
		return this.simbolo;
	}
});
