import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View, FlatList, ActivityIndicator } from "react-native";
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import axios from 'axios';
import { encode } from 'base-64';


const GEMINI_API_KEY = "AIzaSyCoUrY_KJ-qHzDEuCm9ohcbwd2utYdQ6V0"; 

const App = () => {

  const localimage= require('./android/assets/1.png');
  const [img, setImg] = useState(localimage);
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [descriptionLoading, setDescriptionLoading] = useState(false);

  const handlePress = () => {
    Alert.alert(
      'Choose an Option',
      'Do you want to take a photo or choose from gallery?',
      [
        { text: 'Take Photo', onPress: handleCameraLaunch},
        { text: 'Choose from Gallery', onPress: openImagePicker },
        { text: 'Cancel', style: 'cancel' },
        
      ],
      { cancelable: true }
    );
    setTags([]);
    setDescription("");
    
  };

  const openImagePicker = () => {
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
          analyzeImage(base64Image);
        }
      }
    });
  };

  const handleCameraLaunch = () => {
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
          analyzeImage(base64Image);
        }
      }
    });
  };

  const getDescriptionFromChatBot = async (tags : any) => {
    try {
      setDescriptionLoading(true); 
  
      
      const prompt = `Generate a description for selling an item based on these tags: ${tags.join(', ')}. The description should be engaging and persuasive, but no more than 50 words.`;
  
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });
  
      const data = await response.json();
      console.log("Full API Response:", data);
  
      let description = data.candidates?.[0]?.content?.parts?.[0]?.text || "No description available";
      
      description = description.split(' ').slice(0, 50).join(' ');
  
     
      description = description.replace(/\*/g, ""); 
  
      setDescription(description);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert('Error', 'Failed to generate description.');
    } finally {
      setDescriptionLoading(false); 
    }
  };
  
  
  const analyzeImage = (base64Image : any) => {
    setLoading(true); 
    const apiKey = 'acc_95433db4448218e';
    const apiSecret = 'c17e270e258e464ef09c629fa0190eb1';
    const authHeader = `Basic ${encode(`${apiKey}:${apiSecret}`)}`;
  
   
    const cleanBase64Image = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  
  
    const formData = new FormData();
    formData.append('image_base64', cleanBase64Image);
  
    axios.post(
      'https://api.imagga.com/v2/tags',
      formData,
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'multipart/form-data',  
        },
      }
    )
    .then(response => {
      if (response.data && response.data.result) {
        const imageTags = response.data.result.tags.map((tag: { tag: { en: any; }; }) => tag.tag.en);
        setTags(imageTags);
        getDescriptionFromChatBot(imageTags); 
      } else {
        console.log('Unexpected response format:', response.data);
      }
    })
    .catch(error => {
      console.log('Error analyzing image: ', JSON.stringify(error.response?.data, null, 2));
    })
    .finally(() => {
      setLoading(false);
    });
  };

  
  const renderTagItem = ({ item }) => (
    <View style={styles.tagItem}>
      <Text style={styles.tagText}>{item}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {img && <Image style={styles.image} resizeMode="contain" source={img} />}
        <TouchableOpacity style={styles.button} onPress={handlePress}>
          <Text style={styles.buttonText}>Choose Image</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>Description:</Text>
        {descriptionLoading ? (
          <ActivityIndicator size="large" color="#8d8ddf" style={styles.loader} />
        ) : (
          <Text style={styles.descriptionText}>{description}</Text>
        )}
      </View>
      <View style={styles.tagsContainer}>
        <Text style={styles.tagsTitle}>Tags:</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#8d8ddf" style={styles.loader} />
        ) : (
          <FlatList
            data={tags}
            renderItem={renderTagItem}
            keyExtractor={(item, index) => index.toString()}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  imageContainer: {
    flex: 2,  
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  image: {
    width: '100%',
    height: '70%',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#8d8ddf',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'black',
    fontSize: 15,
  },
  descriptionContainer: {
    flex: 1,  
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    padding: 10,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
  },
  tagsContainer: {
    flex: 1,  
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    padding: 10,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tagItem: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxWidth: '100%',
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
