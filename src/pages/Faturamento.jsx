import { useEffect, useState } from 'react';
import { VictoryBar, VictoryChart, VictoryPie } from 'victory-native';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import style from '../assets/style.json';
import BottomBar from '../components/BottomBar';
import Padding from '../components/Padding';
import { Feather } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const Faturamento = () => {
    const [data, setData] = useState([]);
    const [dataMedia, setDataMedia] = useState([]);
    const [entradas, setEntradas] = useState(0);
    const [saidas, setSaidas] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const navigator = useNavigation();

    const houveMovimento = (entradas, saidas) => {
        return entradas != 0 || saidas != 0;
    }

    useEffect(() => {
        setIsLoading(true);
        async function getData() {
            const response = await fetch('https://controle-produtos.onrender.com/firebaseApi/faturamento?uid=' + getAuth().currentUser.uid);
            const data = await response.text()
            if (response.status !== 200) {
                console.warn(data);
                Alert.alert('Erro', 'Erro ' + response.status + ' - ' + data);
                navigator.goBack();
            } else {
                const json = JSON.parse(data);
                setEntradas(json.entradas);
                setSaidas(json.saidas);
                setDataMedia(json.media);
                setData([
                    {
                        x: `Entradas: \nR$${json.entradas.toFixed(2)}`,
                        y: houveMovimento(json.entradas, json.saidas) ? json.entradas : 1,
                        symbol: { fill: "green", type: "square" },
                        name: "Entradas"
                    },
                    {
                        x: `Saidas: \nR$${json.saidas.toFixed(2)}`,
                        y: houveMovimento() ? json.saidas : 1,
                        symbol: { fill: "red", type: "square" },
                        name: "Saidas"
                    }
                ])
            }
        }
        getData().then(() => setIsLoading(false));
    }, [])

    return (
    <View style={{flex:1}}>
        <ScrollView contentContainerStyle={{ justifyContent: "center", alignItems: 'center' }} style={style.container}>

            {isLoading ?
                <>
                    <Text style={{ alignSelf: 'center' }}>Carregando informações, pode levar alguns segundos</Text>
                    <ActivityIndicator size={24} color={style.colors.primaryDark} />
                </> :
                (
                    <>
                        <Text style={style.text}>Faturamento Mensal</Text>
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
                            <Text style={style.text}>Saldo Mensal: R$ {(entradas - saidas).toFixed(2)}</Text>
                        </View>
                        <View style={{ marginTop: 20, paddingTop:5,borderTopColor:style.colors.secondaryDark,borderTopWidth:1 }}>
                            <Text style={{ ...style.text, alignSelf: 'center' }}>Média dos últimos 3 meses:</Text>
                            <VictoryChart
                                width={350}
                                domainPadding={25}
                            >
                                <VictoryBar
                                    labels={({ datum }) => `R$ ${datum.y}`}
                                    data={dataMedia}
                                    style={{
                                        data: { fill: ({ datum }) => datum.y > 0 ? "green" : "red" },
                                        labels: { padding: 25, fill: "black", fontSize: 18, fontFamily: "sans-serif" },
                                    }}
                                />
                            </VictoryChart>
                        </View>
                    </>
                )}
            <Padding />
        </ScrollView>
        <BottomBar />
    </View>
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