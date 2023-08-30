import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

const XLSX = require('xlsx');

const createJsonFromData = (data, parent) => {
    let json = [];

    const entries = Object.entries(data);
    const len = entries.length;

    if (parent === 'custo') {

        entries.forEach(([k, value]) => {
            json[k] = {
                'Nome': value.nome,
                'Quantidade': value.qtd,
                'Custo': value.custo,
            };
        })
        json[len] = {
            'Nome': 'Total',
            'Custo': { t: 'n', v: len, f: 'SUM(C2:C' + (len + 1) + ')' },
        };
    }
    else if (parent === 'formulacao') {
        let qtdTotal = 0;
        qtdTotal = entries.reduce((a, b) => a + b[1].quantidade, 0);
        for (let i = 0; i < len; i++) {
            json.push({
                'Nome': entries[i][1].nome,
                'Quantidade': entries[i][1].quantidade,
                'Custo': entries[i][1].custo,
                '%': { t: 'n', v: i + 1, f: `(B${i + 2}/B${len+1})` }
            })
        }
        json.push({
            'Nome': 'Total',
            'Quantidade': { t: "n", v: len, f: `SUM(B2:B${len + 1})` }, 
            'Custo': { t: "n", v: len, f: `SUM(C2:C${len + 1})` },
            '%': 1
        })
    }
    return [json, len];

}

export default async function gerarPlanilha(data, nome, parent, action) {
    var action = action ?? 'save';
    try {
        const [json, len] = createJsonFromData(data, parent);
        const name = nome ?? new Date().getTime().toString();
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(json)
        if (parent === 'custo') {
            for (let i = 0; i <= len; i++) {
                console.log('C' + (i + 2))
                ws[`C${i + 2}`].z = '"R$"#,##0.00_);\\("$"#,##0.00\\)';
            }
        }
        else if (parent === 'formulacao') {
            for (let i = 0; i <= len; i++) {
                console.log('B' + (i + 2) + 'C' + (i + 2) + 'D' + (i + 2))
                ws[`B${i + 2}`].z = '#,##0.00';
                ws[`C${i + 2}`].z = '"R$"#,##0.00_);\\("$"#,##0.00\\)';
                ws[`D${i + 2}`].z = "0.00%";
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, 'Custo');
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

        if (action === 'save') {
            const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

            if (permissions.granted) {
                // Gets SAF URI from response
                const directoryUri = permissions.directoryUri;
                const safURI = await StorageAccessFramework.createFileAsync(directoryUri, name, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                await StorageAccessFramework.writeAsStringAsync(safURI, wbout, { encoding: FileSystem.EncodingType.Base64 });
                Alert.alert('Arquivo salvo', 'Arquivo salvo como ' + name + '.xlsx na pasta selecionada');
            }
            else {
                Alert.alert('Permissão negada')
            }
        }
        else if (action === 'share') {
            const available = await Sharing.isAvailableAsync();
            if (!available) {
                Alert.alert('Compartilhamento não disponível')
                return false;
            }
            const localUri = FileSystem.cacheDirectory + name + '.xlsx';
            await FileSystem.writeAsStringAsync(localUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
            await Sharing.shareAsync(localUri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Compartilhar planilha' });
            await FileSystem.deleteAsync(localUri);
        }
    }
    catch (error) {
        console.error(error);
        Alert.alert('Erro ao salvar arquivo')
    }







}