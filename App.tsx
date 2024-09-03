import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageCropPicker from 'react-native-image-crop-picker';
import axios from 'axios';
import { encode } from 'base-64';

// API keys and other constants
const GEMINI_API_KEY = "AIzaSyDTvPhT6m6u6Tc4hj5WlUyZcCrZnKgBdaI";
const CLARIFAI_PAT = '64d13f72f153451aabf6772bd548fa07';
const USER_ID = 'gcp';
const APP_ID = 'generate';
const MODEL_ID = 'Imagen';
const MODEL_VERSION_ID = '8d5508722cc8444385af839b98fdf883';

const App = () => {
  const [img, setImg] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImagePick = () => {
    Alert.alert(
      'Choose an Option',
      'Would you like to take a photo or choose from the gallery?',
      [
        { text: 'Take Photo', onPress: openCamera },
        { text: 'Choose from Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const openCamera = () => {
    const options = { mediaType: 'photo', includeBase64: true, maxHeight: 2000, maxWidth: 2000 };
    launchCamera(options, (response) => {
      if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        setImg(imageUri);
        // Allow user to crop and select the area
        ImageCropPicker.openCropper({ path: imageUri, width: 300, height: 400 }).then(image => {
          setSelectedRegion(image);
        }).catch(e => console.log(e));
      }
    });
  };

  const openGallery = () => {
    const options = { mediaType: 'photo', includeBase64: true, maxHeight: 2000, maxWidth: 2000 };
    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        setImg(imageUri);
        // Allow user to crop and select the area
        ImageCropPicker.openCropper({ path: imageUri, width: 300, height: 400 }).then(image => {
          setSelectedRegion(image);
        }).catch(e => console.log(e));
      }
    });
  };

  const analyzeImage = async () => {
    if (!selectedRegion) return;

    setLoading(true);
    const base64Image = selectedRegion.data; // or get base64 data from the image

    const apiKey = 'acc_95433db4448218e';
    const apiSecret = 'c17e270e258e464ef09c629fa0190eb1';
    const authHeader = `Basic ${encode(`${apiKey}:${apiSecret}`)}`;

    const cleanBase64Image = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    const formData = new FormData();
    formData.append('image_base64', cleanBase64Image);

    try {
      const response = await axios.post('https://api.imagga.com/v2/tags', formData, {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.result) {
        const imageTags = response.data.result.tags.map(tag => tag.tag.en);
        await getTitleAndDescription(imageTags);
      }
    } catch (error) {
      console.log("Error analyzing image:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTitleAndDescription = async (tags) => {
    try {
      const titlePrompt = `Generate a title for my image based on these tags only title nothing else: ${tags.join(', ')}. The title should be no more than 15 words.`;
      const descPrompt = `Generate a description for my image based on these tags: ${tags.join(', ')}. The description should be no more than 50 words.`;

      const responses = await Promise.all([
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: titlePrompt }] }] }),
        }).then(res => res.json()),

        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: descPrompt }] }] }),
        }).then(res => res.json()),
      ]);

      const generatedTitle = responses[0].candidates?.[0]?.content.parts?.[0]?.text || "No title generated";
      const generatedDesc = responses[1].candidates?.[0]?.content.parts?.[0]?.text || "No description generated";

      setTitle(generatedTitle);
      setDescription(generatedDesc);
    } catch (error) {
      console.log("Error generating title and description:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contanier2}>
        <TouchableOpacity onPress={handleImagePick}>
          <Image
            resizeMode="contain"
            source={img ? { uri: img } : require('./android/assets/1.png')}
            style={styles.image}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={analyzeImage} style={styles.button} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Generate Title & Description'}</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      <View style={{ flex: 1, width: '100%', padding: 10 }}>
        <View style={styles.titlecontainer}>
          <Text>Title: {title}</Text>
        </View>
        <View style={styles.descriptionconatainer}>
          <Text>Description: {description}</Text>
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
    flex: 1,
    borderWidth: 1,
    width: '100%',
    height: '20%',
    borderRadius: 10
  },
  titlecontainer: {
    flex: 1,
    borderWidth: 1,
    width: '100%',
    height: '20%',
    borderRadius: 10
  }
});

export default App;
