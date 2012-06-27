"use strict";

var Gramatica = new Prototipo({
	inicializar: function(nome) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(nome, String));
		this.nome = nome;
		this.naoTerminais = {};
		this.terminais = {};
		this.simboloInicial = null;
		this.codigo = "";
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
	
	firsts: function() {
		var conjuntoDeFirsts = {};
		this.naoTerminais.paraCada(function(naoTerminal, simboloDoNaoTerminal) {
			naoTerminal.first(conjuntoDeFirsts);
		});
		console.log(conjuntoDeFirsts);
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
	
	first: function(firsts, simboloReceptor) {
		var meuSimbolo = this.simbolo;
		if (Utilitarios.nuloOuIndefinido(firsts[meuSimbolo])) {
			firsts[meuSimbolo] = {};
			this.producoes.paraCada(function(producao, indiceDaProducao) {
				var indiceDoSimbolo = 0;
				var proximoSimbolo = producao[indiceDoSimbolo];
				var simboloDoProximo = null;
				var anteriorDerivaEpsilon = false;
				do {
					proximoSimbolo.first(firsts, meuSimbolo);
					simboloDoProximo = proximoSimbolo.simbolo;
					anteriorDerivaEpsilon = proximoSimbolo.derivaEpsilon();
					proximoSimbolo = producao[++indiceDoSimbolo];
				} while (anteriorDerivaEpsilon && indiceDoSimbolo < producao.length);
				if (anteriorDerivaEpsilon && indiceDoSimbolo === producao.length) {
					firsts[meuSimbolo]["&"] = firsts[simboloDoProximo]["&"];
				}
			});
		}
		var receptor = firsts[simboloReceptor];
		if (!Utilitarios.nuloOuIndefinido(receptor)) {
			firsts[meuSimbolo].paraCada(function(meuFirst, chaveDoMeuFirst) {
				if (!meuFirst.epsilon()) {
					firsts[simboloReceptor][chaveDoMeuFirst] = meuFirst;
				}
			});
		}
	},
	
	follow: function() {
		
	},
	
	epsilon: function() {
		return false;
	},
	
	derivaEpsilon: function() {
		var derivaEpsilon = false;
		this.producoes.paraCada(function(producao, indiceDaProducao) {
			if (producao.length === 1) {
				if (producao[0].epsilon()) {
					derivaEpsilon = true;
					return;
				}
			}
		});
		return derivaEpsilon;
	}
});

var Terminal = new Prototipo({
	inicializar: function(simbolo) {
		Utilitarios.assegureQue(Utilitarios.instanciaDe(simbolo, String));
		this.simbolo = simbolo;
	},
	
	first: function(firsts, simboloReceptor) {
		var meuSimbolo = this.simbolo;
		if (Utilitarios.nuloOuIndefinido(firsts[meuSimbolo])) {
			var meuConjuntoDeFirsts = {};
			meuConjuntoDeFirsts[meuSimbolo] = this;
			firsts[meuSimbolo] = meuConjuntoDeFirsts;
		}
		var receptor = firsts[simboloReceptor];
		if (!Utilitarios.nuloOuIndefinido(receptor)) {
			firsts[simboloReceptor][meuSimbolo] = this;
		}
	},
	
	follow: function() {
		
	},
	
	epsilon: function() {
		return (this.simbolo === "&");
	},
	
	derivaEpsilon: function() {
		return false;
	}
});