import { StyleSheet, View, TouchableOpacity, Text, Alert } from "react-native"
import style from "../assets/style.json"
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/core";
import { get, getDatabase, ref } from "firebase/database";
import { InputWithLabel } from "./InputWithLabel";
import { AntDesign } from '@expo/vector-icons';
import { update, set } from "firebase/database";
import { Camera } from "expo-camera";

export default function QRCodeScanner({ route }) {
    const navigation = useNavigation();
    const [scanned, setScanned] = useState(false);
    const [produto, setProduto] = useState(null);
    const [hasPermission, setHasPermission] = useState(null);
    const [quantidade, setQuantidade] = useState('');
    const uid = route.params.uid;
    const vendaId = route.params.vendaId;
    const db = getDatabase();

    const handleBarCodeScanned = async (scanningResult) => {
        const { t, data } = scanningResult;
        const snapshot = await get(ref(db, `data/${uid}/produtos/${data}`)).catch((error) => {
            console.error(error);
        });
        if (snapshot.exists()) {
            setProduto(snapshot.val());
        }
        else {
            setScanned(false);
            Alert.alert("Produto não encontrado");
        }
        if (produto) setScanned(true);

        setTimeout(() => {
            setScanned(false);
        }, 3000);
    };

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };
        getBarCodeScannerPermissions();
    }, []);

    const cache = async () => {
        if (quantidade == 0 || quantidade == '' || quantidade == '0') {
            await set(ref(db, `data/${uid}/temp/venda/${vendaId}/${produto.id}`), null)
            return;
        }
        const preco = produto.preco * parseInt(quantidade);
        await set(ref(db, `data/${uid}/temp/venda/${vendaId}/empty`), null)
        await update(ref(db, `data/${uid}/temp/venda/${vendaId}/${produto._id}`), {
            id: produto._id,
            quantidade: parseFloat(quantidade),
            nome: produto.nome,
            preco: preco
        })
    }

    if (hasPermission === null) {
        return <Text>Para utilizar o leitor, é necessário autorizar o acesso a camêra</Text>;
    }
    if (hasPermission === false) {
        return <Text>Sem acesso a camêra</Text>;
    }

    return (
        <View style={{ flex: 1 }}>
            {!scanned ? <>
                <Camera
                    type={Camera.Constants.Type.back}
                    barcodeScanningEnabled={true}
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                    style={StyleSheet.absoluteFillObject}
                    barcodeTypes={[
                        Camera.Constants.BarcodeScannerType.qr,
                        Camera.Constants.BarcodeScannerType.ean13,
                        Camera.Constants.BarcodeScannerType.code128
                    ]}
                />
                <TouchableOpacity
                    style={{
                        borderRadius: 50,
                        backgroundColor: 'red',
                        position: 'absolute',
                        bottom: 0,
                        margin: 20,
                        padding: 10,
                        alignSelf: 'center'
                    }}
                    onPress={() => {
                        setScanned(false)
                        navigation.goBack();
                    }}>
                    <AntDesign name="close" size={24} color="white" />
                </TouchableOpacity>
            </> :
                <View style={style.container}>
                    <Text style={style.text}>Produto: {produto.nome}</Text>
                    <InputWithLabel onChangeText={t => setQuantidade(t)}
                        label={"Quantidade - " + produto.quantidade + " em estoque"}
                        value={quantidade} type="numeric" />
                    <TouchableOpacity style={style.button} onPress={() => {
                        if (parseFloat(quantidade) > parseFloat(produto.quantidade)) {
                            Alert.alert("Quantidade maior que a disponível");
                        }
                        if (parseFloat(quantidade) <= 0) {
                            Alert.alert("Quantidade inválida");
                        }
                        else {
                            cache();
                            setScanned(false);
                            navigation.goBack();
                        }
                    }}>
                        <Text style={style.textButton}>Adicionar</Text>
                    </TouchableOpacity>
                </View>}
        </View>
    )
}