import { View } from "react-native";
import { StyleSheet } from "react-native";

const PFP = ({bg,hd,bd}) => {
    return (
        <View style={{...style.pfp, backgroundColor: bg ?? 'transparent'}}>
            <View style={{...style.head, backgroundColor: hd ?? '#1F3829'}}></View>
            <View style={{...style.body, backgroundColor: bd ?? '#1F3829'}}></View>
        </View>
    )
}
const style = StyleSheet.create({
    pfp: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderColor: 'black',
        borderWidth: 1,
        alignItems: 'center',
        overflow: 'hidden',
    },
    head:{
        width: 51,
        height: 51,
        borderRadius: 50,
    },
    body:{
        width: 100,
        height: 100,
        borderRadius: 50,
    }
})


export default PFP;