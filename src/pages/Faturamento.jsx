import { useEffect, useState } from 'react';
import { VictoryBar, VictoryChart, VictoryPie } from 'victory-native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import style from '../assets/style.json';
import BottomBar from '../components/BottomBar';
import Padding from '../components/Padding';
import { get, getDatabase, ref, set } from 'firebase/database';
import firebase from '../services/firebaseConfig';
import { getAuth } from 'firebase/auth';

const Faturamento = () => {
    const [data, setData] = useState([]);
    const [dataMedia, setDataMedia] = useState([]);
    const [responseEntradas, setResponseEntradas] = useState({})
    const [responseSaidas, setResponseSaidas] = useState({})
    const [entradas, setEntradas] = useState(0);
    const [saidas, setSaidas] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const db = getDatabase(firebase);

    const houveMovimento = () => {
        return entradas != 0 || saidas != 0;
    }

    useEffect(() => {
        setIsLoading(true);
        get(ref(db, `data/${getAuth().currentUser.uid}/faturamento/entradas`)).then((snapshot) => {
            if (snapshot.exists()) { //Pegar as entradas do BD
                setResponseEntradas(snapshot.val())
                getEntradasAtual(new Date().getFullYear(), new Date().getMonth() + 1)
            }
            else {
                setResponseEntradas({});
                return false;
            }
        }
        ).catch(error => {
            console.warn(error);
        })
        get(ref(db, `data/${getAuth().currentUser.uid}/faturamento/saidas`))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    setResponseSaidas(snapshot.val())
                    getSaidasAtual(new Date().getFullYear(), new Date().getMonth() + 1)
                }
                else {
                    setResponseSaidas({});
                    return false;
                }
                console.log(entradas + ' ' + saidas)
                setData([
                    {
                        x: `Entradas: \nR$${entradas}`,
                        y: houveMovimento() ? entradas : 1,
                        symbol: { fill: "green", type: "square" },
                        name: "Entradas"
                    },
                    {
                        x: `Saidas: \nR$${saidas}`,
                        y: houveMovimento() ? saidas : 1,
                        symbol: { fill: "red", type: "square" },
                        name: "Saidas"
                    }])
            }).catch(error => {
                console.warn(error);
            }).finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        getMedia();
    }, [entradas, saidas, responseEntradas, responseSaidas])

    const getSaidasAtual = (year, month) => {
        let valorSaidas = 0;
        Object.entries(responseSaidas).forEach(([key, value]) => {
            if (value.data.ano == year && value.data.mes == month) {
                valorSaidas += value.valor;
            }
        })
        setSaidas(valorSaidas)
    }

    const getEntradasAtual = (year, month) => {
        let valorEntradas = 0;
        Object.entries(responseEntradas).forEach(([key, value]) => {
            if (value.data.ano == year && value.data.mes == month) {
                valorEntradas += value.valor;
            }
        })
        setEntradas(valorEntradas)
    }

    const getMes = (mes) => {
        Enumerator = {
            1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr',
            5: 'Mai', 6: 'Jun', 7: 'Jul', 8: 'Ago',
            9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez'
        }
        return Enumerator[mes];
    }

    const getMedia = () => {
        let valorEntradasMesPassado = 0;
        let valorEntradasMesAntepenultimo = 0;
        let valorSaidasMesPassado = 0;
        let valorSaidasMesAntepenultimo = 0;
        const mesAtual = new Date().getMonth() + 1;
        const mesPenultimo = mesAtual == 1 ? 12 : mesAtual - 1;
        const mesAntepenultimo = mesAtual == 1 ? 11 : mesAtual - 2;
        Object.entries(responseEntradas).forEach(([key, value]) => {
            if (value.data.mes == mesPenultimo) {
                valorEntradasMesPassado += value.valor;
            } else if (value.data.mes == mesAntepenultimo) {
                valorEntradasMesAntepenultimo += value.valor;
            }
        })
        Object.entries(responseSaidas).forEach(([key, value]) => {
            if (value.data.mes == mesPenultimo) {
                valorSaidasMesPassado += value.valor;
            } else if (value.data.mes == mesAntepenultimo) {
                valorSaidasMesAntepenultimo += value.valor;
            }
        })
        setDataMedia(
            [
                { x: getMes(mesAntepenultimo), y: valorEntradasMesAntepenultimo - valorSaidasMesAntepenultimo },
                { x: getMes(mesPenultimo), y: valorEntradasMesPassado - valorSaidasMesPassado },
                { x: getMes(mesAtual), y: entradas - saidas },
            ]
        );
    }

    return (<>
        <ScrollView contentContainerStyle={{ justifyContent: "center", alignItems: 'center' }} style={style.container}>
            <Text style={style.text}>Faturamento Mensal</Text>
            {isLoading ?
                <ActivityIndicator size={24} color={'black'} /> :
                (
                    <>
                        <VictoryPie
                            style={{
                                labels: { fill: "black", fontSize: 18, fontWeight: "bold", fontFamily: "sans-serif" },
                            }}
                            labelRadius={({ innerRadius }) => innerRadius + 15}
                            width={350}
                            height={350}
                            data={data}
                            innerRadius={70}
                            colorScale={
                                ["#00ff00", "#ff3333"]}
                        />
                        <View style={styles.legend}>
                            <View style={styles.legendEntrada}></View>
                            <Text style={style.text}>Entradas</Text>
                        </View>
                        <View style={styles.legend}>
                            <View style={styles.legendSaida}></View>
                            <Text style={style.text}>Saidas</Text>
                        </View>
                        <View style={styles.legend}>
                            <Text style={style.text}>Lucro Mensal: R$ {entradas - saidas}</Text>
                        </View>
                        <View style={{ marginTop: 20 }}>
                            <Text style={{ ...style.text, alignSelf: 'center' }}>Média dos últimos 3 meses:</Text>
                            <VictoryChart
                                width={350}
                                domainPadding={25}>
                                <VictoryBar
                                    labels={({ datum }) => `R$ ${datum.y}`}
                                    data={dataMedia}
                                />
                            </VictoryChart>
                        </View>
                    </>
                )}
            <Padding />
        </ScrollView>
        <BottomBar />
    </>
    )
}

const styles = StyleSheet.create({
    legendEntrada: {
        width: 22,
        height: 22,
        backgroundColor: "#00ff00",
        marginRight: 5,
    },
    legendSaida: {
        width: 22,
        height: 22,
        backgroundColor: "#ff3333",
        marginRight: 5,
    },
    legend: {
        flexDirection: "row",
        alignItems: "center",
        width: "80%",
    }
});


export default Faturamento;