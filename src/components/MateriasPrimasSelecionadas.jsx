import { get } from "firebase/database";
import { ref } from "firebase/database";
import { useState } from "react";
import { Text, View } from "react-native";

//Será utilizado na tela de cadastro de receita para mostrar as matérias primas selecionadas


export default function MateriasPrimasSelecionadas({materiasPrimas,db,uid,formId}){
    console.log(materiasPrimas)
    /*const [data,setData] = useState([])
    get(ref(db,`data/${uid}/temp/form/${formId}`),(snapshot) => {
        if (snapshot.exists()) {
            setData(snapshot.val())
            console.log(data)
        }
    })*/
    return(
        <View>
            {materiasPrimas!==null?
            Object.keys(materiasPrimas).map((index,key) => {
                console.log(key)
                return(
                    <View key={index} style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        margin: 5,
                        paddingTop: 10,
                        borderTopColor: 'black',
                        borderTopWidth: 1,
                    }}>
                        <Text style={{ fontSize: 20, marginLeft: 5 }}>{data[key].nome} - {data[key].quantidade}{data[key].unMedida}</Text>
                    </View>
                )
            }):
            <Text>Nenhuma matéria prima selecionada</Text>
            }
        </View>
    )
}