import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { Alert } from 'react-native';

const XLSX = require('xlsx');

const createJsonFromData = (data) => {
    const json = [];

    const entries = Object.entries(data);
    const len = entries.length;
    entries.forEach(([k, value]) => {
        json[k] = {
            'Nome': value.nome,
            'Quantidade': value.qtd,
            'Custo': value.custo,
        };
    })
    json[len] = {
        'Nome': 'Total',
        'Custo': '=SUM(C2:C' + (len + 1) + ')',
    };
    return json;

}

export default async function gerarPlanilha(data) {
    try {
        const json = createJsonFromData(data);
        const name = new Date().getTime() + '.xlsx';
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(json)
        XLSX.utils.book_append_sheet(wb, ws, 'Custo');
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (permissions.granted) {
            // Gets SAF URI from response
            const directoryUri = permissions.directoryUri;
            const safURI = await StorageAccessFramework.createFileAsync(directoryUri,name.split('.xlsx')[0], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            await StorageAccessFramework.writeAsStringAsync(safURI, wbout, { encoding: FileSystem.EncodingType.Base64 });
            Alert.alert('Arquivo salvo', 'Arquivo salvo como ' + name+ ' na pasta selecionada');    
        }
        else{
            Alert.alert('Permissão negada')
        }
    }
    catch (error) {
        console.error(error);
        Alert.alert('Erro ao salvar arquivo')
    }







}