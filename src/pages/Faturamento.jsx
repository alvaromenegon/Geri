import { useEffect, useState } from 'react';
import { VictoryBar, VictoryChart, VictoryPie } from 'victory-native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import style from '../assets/style.json';
import BottomBar from '../components/BottomBar';
import Padding from '../components/Padding';
import { get,getDatabase,ref } from 'firebase/database';
import firebase from '../services/firebaseConfig';
import { getAuth } from 'firebase/auth';

const Faturamento = () => {
    const [data, setData] = useState([]);
    const [response, setResponse] = useState({})
    const [isLoading, setIsLoading] = useState(true);
    const db = getDatabase(firebase);
    
    useEffect(() => {
        setIsLoading(true);
        get(ref(db, `data/${getAuth().currentUser.uid}/vendas`))
        .then((snapshot) => {
            if (snapshot.exists()) {
                setResponse(snapshot.val())
            }
            else {
                console.warn('No data');
                setResponse({});
                return false;
            }
            /*setData([
                {
                    x: `Entradas: \nR$${response.atual}`,
                    y: response.atual || 1,
                    symbol: { fill: "green", type: "square" },
                    name: "Entradas"
                },
                {
                    x: `Saidas: \nR$ ${response.gastos}`,
                    y: response.gastos || 1,
                    symbol: { fill: "red", type: "square" },
                    name: "Saidas"
                }])*/
                
                //Analisar data das vendas e preencher o gráfico
        }).catch(error => {
            console.log(error);
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    return (<Text>A implementar</Text>)
}

    /*return (<>
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
                            <View style={styles.legendEntrada}>

                            </View>
                            <Text style={style.text}>Entradas</Text>
                        </View>
                        <View style={styles.legend}>
                            <View style={styles.legendSaida}>

                            </View>
                            <Text style={style.text}>Saidas</Text>
                        </View>
                        <View style={styles.legend}>
                            <Text style={style.text}>Lucro Mensal: R$ {response.atual - response.gastos}</Text>
                        </View>
                        <View style={{ marginTop: 20 }}>
                            <Text style={{...style.text,alignSelf:'center'}}>Média dos últimos 3 meses:</Text>
                            <VictoryChart
                                width={350}
                                domainPadding={25}
                            >
                                <VictoryBar
                                    labels={({ datum }) => `R$ ${datum.y}`}
                                    data={[
                                        { x: response.mes.penultimo, y: response.penultimo },
                                        { x: response.mes.ultimo, y: response.ultimo },
                                        { x: response.mes.atual, y: response.atual }]}
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
}*/

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