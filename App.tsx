import React, { useState } from "react";
import { Button, Platform, SafeAreaView, Text, View } from "react-native";

import DateTimePicker  from "@react-native-community/datetimepicker";



const App = () => {

  const [date,setdate]=useState(new Date());
  const [mode,setmode]=useState('date');
  const [show,setshow]=useState(false);


  const onChange=(event:any, SelectedDate: any)=>
  {
    const currentdate= SelectedDate || date;
    setshow(Platform.OS==='ios');
      setdate(currentdate);
    
  }

  const Showmode =(currentmode: any)=>{
    setshow(true);
    setmode(currentmode);

  }

  const showdatepicker=()=>{
    Showmode('date');
  }

  const Showtimerpicker=()=>{
    Showmode('time');

  }

  return (
    <SafeAreaView style={{
      flex: 1,
      justifyContent: 'center', alignItems: 'center'
    }}>
      <View>
        <View style={{marginBottom:20}}>
          <Button title="Show Date Picker" onPress={showdatepicker}/>
          
        </View>
        <View style={{marginBottom:20}}>
        <Button title="Show Time Picker" onPress={Showtimerpicker}/>
          
        </View>
        <Text style={{fontSize:20}}>Selected date: {date.toLocaleDateString()}</Text>

        <Text style={{fontSize:20}}>Selected Time: {date.toLocaleTimeString()}</Text>

      </View>
      {show && (
        <DateTimePicker 

        testID="datetimepicker"
        value={date}
        mode={mode}
        is24Hour={true}
        display="default"
        onChange={onChange}
        />
      )}
      
    </SafeAreaView>
  );
};


export default App;