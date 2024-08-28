import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View, StyleSheet, Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import localImage from './android/assets/1.png'; // Import the local image
import axios from 'axios';
import { encode } from 'base-64';

const App = () => {
  // Local image for default
  const [img, setImg] = useState(localImage);

  const [desc,setdesc]=useState("");
  const [tags,settags]=useState([]);





  const handleImagePick = () => {
    Alert.alert(
      'Choose an Option',
      'Would you like to take a photo or choose from the gallery?',
      [
        {
          text: 'Take Photo',
          onPress: openCamera,
        },
        {
          text: 'Choose from Gallery',
          onPress: gallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        console.log('Camera Error: ', response.errorCode);
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        const base64Image = response.assets[0].base64;

        if (base64Image) {
          setImg({ uri: imageUri });
          analyzeimage(base64Image);
        }
      }
    });
  };

  const gallery = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true, 
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('Image picker error: ', response.errorCode);
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        const base64Image = response.assets[0].base64;

        if (base64Image) {
          setImg({ uri: imageUri });
          analyzeimage(base64Image);
        }
      }
    });
  };

  const analyzeimage=(base64Image: string)=>{

    const apiKey='acc_95433db4448218e';

    const apiSecret='c17e270e258e464ef09c629fa0190eb1';

    const authHeader= `Basic ${encode(`${apiKey}:${apiSecret}`)}`;

    const cleanBase64Image= base64Image.replace(/^data:img\/[a-z]+;base64,/,'');

    const formData =new FormData();
    formData.append('image_base64',cleanBase64Image);

    axios.post(
      'https://api.imagga.com/v2/tags',
      formData,
      {
        headers:{
          Authorization:authHeader,
          'Content-Type':'multipart/form-data',
        },  
      }
    )
    .then(response => {
      if (response.data && response.data.result) {
        const imageTags = response.data.result.tags.map((tag: { tag: { en: any; }; }) => tag.tag.en);
        console.log(imageTags)
        settags(imageTags);
      } else {
        console.log('Unexpected response format:', response.data);
      }
    })
  

  }

  return (
    <View style={styles.container}>
      <View style={styles.contanier2}>
        <TouchableOpacity onPress={handleImagePick}>
          <Image
            resizeMode="contain"
            source={typeof img === 'string' ? { uri: img } : img}
            style={styles.image}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleImagePick} style={styles.button}>
          <Text style={styles.buttonText}>Choose Image</Text>
        </TouchableOpacity>
      </View>
      <View style={{flex:1}}>
        <View style={styles.descriptionconatainer}>
          <Text>Description:</Text>
        </View>
        <View style={styles.tagscontainer}>
          <Text>Tags :</Text>
          <Text>{tags}</Text>
        </View>
      </View>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  contanier2: {
    flex: 2,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center'

  },
  image: {
    width: 400,
    height: 400,
  },
  button: {
    width: 200,
    height: 50,
    backgroundColor: '#8d8ddf',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'black',
    fontSize: 20,
  },
  descriptionconatainer: {
    flex: 1
  },
  tagscontainer: {
    flex: 1
  }
});

export default App;
