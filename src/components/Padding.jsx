import { View } from "react-native";

export default function Padding(props){
    return (
        <View style={{padding: props.padding || 50}}>
        </View>
    )
}