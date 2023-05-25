import { TextInput, Text, View, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import style from '../assets/style.json';
import { Picker } from "@react-native-picker/picker";

function DatePicker(props) {
    const [changed, setChanged] = useState(false);
    const date = props.date || new Date();
    const onChange = props.onChange || (() => { });

    useEffect(() => {
        if (props.date != null) {
            setChanged(true);
        }
    }, [props.date])

    const showDatepicker = () => {
        try {
            DateTimePickerAndroid.open({
                value: date,
                onChange,
                mode: 'date',
                is24Hour: true,
                display: 'spinner',
            })
        } catch (e) {
            console.log(e);
        }
    };
    return (
        <View style={styles.iwl}>
            <Text style={styles.label}>{props.label}</Text>
            <TouchableOpacity
                style={style.textInput}
                onPress={showDatepicker}
            >
                <Text style={{
                    padding: 5
                }}>{changed ? date.toLocaleDateString() : "__/__/____"}</Text>
            </TouchableOpacity>
        </View>

    );
}


const Select = (props) => {
    const onValueChange = props.onValueChange || (() => { });
    const value = props.value || null;

    return (
        <View style={{
            margin: 5,
        }}>
            <Text style={styles.label}>{props.label}:</Text>
            <View style={{
                borderColor: 'grey', borderWidth: 1,
                borderRadius: 5, backgroundColor: 'white',
            }}>
                <Picker
                    selectedValue={value}
                    placeholder="Selecione um"
                    onValueChange={onValueChange}
                    prompt={props.label}
                >
                    <Picker.Item label="Selecione" enabled={false}
                        value={null}
                    />
                    {props.items.map((item, i) => {
                        return (
                            <Picker.Item label={item.label} value={item.value} key={i} />
                        )
                    })
                    }

                </Picker>
            </View>
        </View>
    )
}

function InputWithLabel(props) {
    const type = props.type || "default";
    const editable = !props.disabled ?? true;
    const value = props.value;    
    const onChangeText = props.onChangeText || (() => { });
    const onBlur = props.onBlur || (() => { });
    const secure = props.secure || false;
    const placeholder = props.placeholder || '';
    
    return (
        <View style={styles.iwl}>

            <Text style={styles.label}>{props.label}:</Text>
            <TextInput
                editable={editable}
                style={style.textInput}
                onChangeText={onChangeText}
                onBlur={onBlur}
                keyboardType={type}
                secureTextEntry={secure}
                value={value}
                placeholder={placeholder}
            />
        </View>
    )
}


const styles = StyleSheet.create({
    iwl: {
        margin: 5,
        flex: 2
    },
    label: {
        fontSize: 20,
        marginBottom: 5
    }

})

export { InputWithLabel, DatePicker, Select }