import { Text, View } from "react-native";
import { useState } from "react";
import InputWithLabel from "../components/InputWithLabel";

export default function Login() {
    const [login, setLogin] = useState('');
    const [senha, setSenha] = useState('');
    return (
        <>
        <View>
            <Text>Controle</Text>
        </View>
        <View>
            <InputWithLabel
                label='Login'
            ></InputWithLabel>

        </View>
        
        
        </>

    )
}