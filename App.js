import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  ImageBackground,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

export default function App() {
  const [quantidades, setQuantidades] = useState({
    pastel: 0,
    mandioca: 0,
    suco: 0,
  });
  const [descontos, setDescontos] = useState({
    pastel: 0,
    mandioca: 0,
    suco: 0,
  });
  const [bingo, setBingo] = useState('');
  const [recebido, setRecebido] = useState('');
  const [total, setTotal] = useState(0);
  const [troco, setTroco] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [mostrarEntradaDesconto, setMostrarEntradaDesconto] = useState(false);
  const [itemAtualParaDesconto, setItemAtualParaDesconto] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [proxId, setProxId] = useState(0);
  const [totalGeralAcumulado, setTotalGeralAcumulado] = useState(0);
  const [senha, setSenha] = useState('');
  const [senhaCorreta, setSenhaCorreta] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [historicoModalVisible, setHistoricoModalVisible] = useState(false);

  const precos = { pastel: 5.0, mandioca: 4.0, suco: 2.0 };

  useEffect(() => {
    carregarTransacoes();
  }, []);

  useEffect(() => {
    const valorBingo = bingo ? parseFloat(bingo.replace(',', '.')) : 0;
    const novoTotal = calcularTotal(quantidades, descontos) + valorBingo;
    setTotal(novoTotal);
  }, [bingo, quantidades, descontos]);

  const carregarTransacoes = async () => {
    try {
      const transacoesArmazenadas = await AsyncStorage.getItem('transacoes');
      if (transacoesArmazenadas) {
        const parsedTransacoes = JSON.parse(transacoesArmazenadas);
        setTransacoes(parsedTransacoes);
        if (parsedTransacoes.length > 0) {
          setProxId(parsedTransacoes[parsedTransacoes.length - 1].id + 1);
        }
        calcularTotalGeralAcumulado(parsedTransacoes);
      }
    } catch (error) {
      console.error('Falha ao carregar transações:', error);
    }
  };

  const salvarTransacoes = async (novasTransacoes) => {
    try {
      await AsyncStorage.setItem('transacoes', JSON.stringify(novasTransacoes));
    } catch (error) {
      console.error('Falha ao salvar transações:', error);
    }
  };

  const atualizarQuantidade = (item, delta) => {
    setQuantidades((prev) => ({
      ...prev,
      [item]: Math.max(0, prev[item] + delta),
    }));
  };

  const aplicarDesconto = (item) => {
    setItemAtualParaDesconto(item);
    setMostrarEntradaDesconto(true);
  };

  const handleEntradaDescontoChange = (valor) => {
    const novoDescontoItem = parseFloat(valor.replace(',', '.')) || 0;
    setDescontos((prev) => ({
      ...prev,
      [itemAtualParaDesconto]: novoDescontoItem,
    }));
  };

  const calcularTotal = (quantidades, descontos) => {
    return Object.keys(quantidades).reduce((total, item) => {
      const desconto = descontos[item] || 0;
      const precoAposDesconto = precos[item] * (1 - desconto / 100);
      return total + quantidades[item] * precoAposDesconto;
    }, 0);
  };

  const resetarValores = () => {
    setQuantidades({ pastel: 0, mandioca: 0, suco: 0 });
    setDescontos({ pastel: 0, mandioca: 0, suco: 0 });
    setBingo('');
    setRecebido('');
    setTotal(0);
    setTroco(null);
  };

  const calcularTroco = () => {
    const valorBingo = bingo ? parseFloat(bingo.replace(',', '.')) : 0;
    const valorTotal = total;
    const valorRecebido =
      formaPagamento === 'Dinheiro'
        ? recebido
          ? parseFloat(recebido.replace(',', '.'))
          : 0
        : valorTotal;

    if (valorRecebido >= valorTotal) {
      const trocoCalculado = valorRecebido - valorTotal;
      setTroco(
        `${valorTotal.toFixed(2)} - ${valorRecebido.toFixed(
          2
        )} = ${trocoCalculado.toFixed(2)}`
      );

      const totalItens = Object.keys(quantidades).reduce((sum, item) => {
        const quantidade = quantidades[item];
        const preco = precos[item];
        const desconto = descontos[item] || 0;
        const precoComDesconto = preco * (1 - desconto / 100);
        return sum + quantidade * precoComDesconto;
      }, 0);

      const novaTransacao = {
        id: proxId,
        quantidades,
        totalItens: totalItens.toFixed(2),
        totalBingo: valorBingo.toFixed(2),
        totalGeral: valorTotal.toFixed(2),
        troco: formaPagamento === 'Dinheiro' ? trocoCalculado : 0,
        formaPagamento,
      };

      const novasTransacoes = [...transacoes, novaTransacao];
      setTransacoes(novasTransacoes);
      setProxId(proxId + 1);
      salvarTransacoes(novasTransacoes);
      calcularTotalGeralAcumulado(novasTransacoes);
      resetarValores();
    } else {
      alert('O valor recebido é menor que o total a pagar.');
    }
  };

  const calcularTotalGeralAcumulado = (transacoes) => {
    const total = transacoes.reduce(
      (acc, transacao) => acc + parseFloat(transacao.totalGeral),
      0
    );
    setTotalGeralAcumulado(total);
  };

  const limparHistorico = async () => {
    setTransacoes([]);
    setTotalGeralAcumulado(0);
    try {
      await AsyncStorage.removeItem('transacoes');
    } catch (error) {
      console.error('Falha ao limpar transações:', error);
    }
  };

  const validarSenha = () => {
    if (senha === '123') {
      setSenhaCorreta(true);
      setModalVisible(false);
      limparHistorico();
    } else {
      alert('Senha incorreta!');
      setSenha('');
    }
  };

  const abrirModalSenha = () => {
    setModalVisible(true);
  };

  const abrirModalHistorico = () => {
    setHistoricoModalVisible(true);
  };

  const fecharModalHistorico = () => {
    setHistoricoModalVisible(false);
  };

  return (
    <ImageBackground
      source={require('./assets/2732389.jpg')}
      style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.caixaText}> CAIXA FELIZ </Text>
        {Object.keys(quantidades).map((item) => (
          <View key={item} style={styles.item}>
            <TouchableOpacity
              onPress={() => aplicarDesconto(item)}
              style={styles.discountButton}>
              <Text>%</Text>
            </TouchableOpacity>
            <Text>{`${
              item.charAt(0).toUpperCase() + item.slice(1)
            } (R$ ${precos[item].toFixed(2).replace('.', ',')})`}</Text>
            <View style={styles.quantityControls}>
              <Button title="-" onPress={() => atualizarQuantidade(item, -1)} />
              <Text style={styles.quantityText}>{quantidades[item]}</Text>
              <Button title="+" onPress={() => atualizarQuantidade(item, 1)} />
            </View>
          </View>
        ))}
        <TextInput
          style={styles.input}
          placeholder="Valor Bingo"
          keyboardType="numeric"
          value={bingo}
          onChangeText={setBingo}
        />
        <View style={styles.cartaoCentral}>
          <Text style={styles.totalText}>
            Total: R$ {total.toFixed(2).replace('.', ',')}
          </Text>
          <Picker
            selectedValue={formaPagamento}
            style={styles.picker}
            onValueChange={setFormaPagamento}>
            <Picker.Item label="Dinheiro" value="Dinheiro" />
            <Picker.Item label="Pix" value="Pix" />
            <Picker.Item label="Débito" value="Débito" />
            <Picker.Item label="Crédito" value="Crédito" />
          </Picker>
          {formaPagamento === 'Dinheiro' && (
            <TextInput
              style={styles.input}
              placeholder="Valor"
              keyboardType="numeric"
              value={recebido}
              onChangeText={setRecebido}
            />
          )}
          <Button title="Calcular" onPress={calcularTroco} />
        </View>

        {troco !== null && (
          <Text style={styles.totalText}>
            Troco: R$ {troco.replace(/\./g, ',')}
          </Text>
        )}

        {mostrarEntradaDesconto && (
          <View style={styles.discountInputContainer}>
            <TextInput
              style={styles.discountInput}
              placeholder={`Desconto para ${itemAtualParaDesconto} (%)`}
              keyboardType="numeric"
              onChangeText={handleEntradaDescontoChange}
            />
            <Button
              title="OK"
              onPress={() => setMostrarEntradaDesconto(false)}
              style={styles.okButton}
            />
          </View>
        )}

        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={[styles.bottomButton, styles.historyButton]}
            onPress={abrirModalHistorico}>
            <Text style={styles.bottomButtonText}>Mostrar Histórico</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bottomButton, styles.clearHistoryButton]}
            onPress={abrirModalSenha}>
            <Text style={styles.bottomButtonText}>Limpar Histórico</Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}>
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <TextInput
                style={styles.input}
                placeholder="Senha"
                secureTextEntry={true}
                value={senha}
                onChangeText={setSenha}
              />
              <Button title="Desbloquear" onPress={validarSenha} />
              <Button title="Cancelar" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={historicoModalVisible}
          onRequestClose={fecharModalHistorico}>
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.totalGeralAcumuladoText}>
                Total Geral Acumulado: R${' '}
                {totalGeralAcumulado.toFixed(2).replace('.', ',')}
              </Text>
              <FlatList
                data={transacoes}
                renderItem={({ item }) => (
                  <View style={styles.transaction}>
                    <Text>ID: {item.id}</Text>
                    <Text>Itens: {JSON.stringify(item.quantidades)}</Text>
                    <Text>
                      Total Itens: R$ {item.totalItens?.replace('.', ',')}
                    </Text>
                    <Text>
                      Total Bingo: R$ {item.totalBingo?.replace('.', ',')}
                    </Text>
                    <Text>
                      Total Geral: R$ {item.totalGeral?.replace('.', ',')}
                    </Text>
                    {typeof item.troco === 'number' && (
                      <Text>
                        Troco: R$ {item.troco.toFixed(2).replace('.', ',')}
                      </Text>
                    )}
                    <Text>Forma de Pagamento: {item.formaPagamento}</Text>
                  </View>
                )}
                keyExtractor={(item) => item.id.toString()}
              />
              <Button title="Fechar" onPress={fecharModalHistorico} />
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    alignItems: 'center',
  },
  caixaText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: 'white',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
    width: '90%',
  },
  discountButton: {
    padding: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    marginHorizontal: 10,
  },
  input: {
    height: 40,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 10,
    paddingHorizontal: 10,
    width: 200,
  },
  picker: {
    height: 50,
    width: 200,
    borderRadius: 5,
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  transaction: {
    marginVertical: 5,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  discountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '70%',
  },
  discountInput: {
    height: 40,
    flex: 1,

    margin: 10,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute',
    bottom: 10,
    paddingHorizontal: 20,
  },
  bottomButton: {
    backgroundColor: 'gray',
    padding: 5,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  bottomButtonText: {
    color: 'white',
    fontSize: 16,
  },
  historyButton: {
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  clearHistoryButton: {
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  totalGeralAcumuladoText: {
    margin: 5,
    fontSize: 12,
    fontWeight: 'bold',
    color: 'green',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cartaoCentral: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
