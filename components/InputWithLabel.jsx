import { TextInput, Text, View } from "react-native";
import { useState } from "react";
export default function InputWithLabel(props) {
    const [login, setLogin] = useState('');
    const [senha, setSenha] = useState('');
    return (
        <View>

            <Text>{props.label}:</Text>
            <TextInput
                style={style.textInput}
            />
        </View>
    )
}

const style = StyleSheet.create({
    textInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        padding: 5,
    }
})