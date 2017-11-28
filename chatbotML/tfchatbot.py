
# coding: utf-8

# In[1]:

import os
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'

# things we need for NLP
import nltk
from nltk.stem.lancaster import LancasterStemmer
stemmer = LancasterStemmer()


# In[2]:


# things we need for tensorflow
import numpy as np
import tflearn
import tensorflow as tf
import random


# In[3]:


user_chatbot_uuid = 'abcd1234'
chatbot_db_folder = './chatbotML/chatbot_db/' + user_chatbot_uuid + '/'


# In[4]:


# import our chat-bot intents file
import json
with open(chatbot_db_folder + 'intents.json') as json_data:
    intents = json.load(json_data)


# In[5]:


words = [] # All the patterns tokenize words store here (Source of truth)
documents = [] # All the list of (tokenize pattern words, intent tag)
classes = [] # All the tags in intents
ignore_words = ['?']


# In[6]:


for intent in intents['intents']:
    # loop through all the patterns in intents
    for pattern in intent['patterns']:
        # tokenize each word in the sentence
        pattern_w = nltk.word_tokenize(pattern)
        # add to our words list
        words.extend(pattern_w)
        # add to documents in our corpus
        documents.append((pattern_w, intent['tag']))
        # add to our classes list
        if intent['tag'] not in classes:
            classes.append(intent['tag'])


# In[7]:


# stem and lower each word and remove duplicates
words = [stemmer.stem(w.lower()) for w in words if w not in ignore_words]
words = sorted(list(set(words)))


# In[8]:


# sort classes and remove duplicates
classes = sorted(list(set(classes)))


# In[9]:


print('total words:', len(words))
print('total classes(tags):', len(classes))
print('total documents:', len(documents))


# In[10]:


# create our training data
training = []


# In[11]:


#create an empty array for our output
output_empty = [0] * len(classes)


# In[12]:


# training set, bag of words for each sentence
for doc in documents:
    # initialize our bag of words
    bag = []
    # list of tokenized words for the pattern
    pattern_words = doc[0]
    # stem each word
    pattern_words = [stemmer.stem(word.lower()) for word in pattern_words]
    
    # create our bag of words array
    for w in words:
        # compare it with our pattern tokenize words
        bag.append(1) if w in pattern_words else bag.append(0)
    
    # output is a '0' for each tag and '1' for current tag
    output_row = list(output_empty)
    output_row[classes.index(doc[1])] = 1
    
    training.append([bag, output_row])


# In[13]:


# shuffle our features and turn into np.array
random.shuffle(training)
training = np.array(training)


# In[14]:


# create train and test lists
train_x = list(training[:,0])
train_y = list(training[:,1])


# In[15]:


print(train_x[0])
print(train_y[0])


# In[16]:


# reset underlying graph data
tf.reset_default_graph()
# Build neural network
net = tflearn.input_data(shape=[None, len(train_x[0])])
net = tflearn.fully_connected(net, 8)
net = tflearn.fully_connected(net, 8)
net = tflearn.fully_connected(net, len(train_y[0]), activation='softmax')
net = tflearn.regression(net)

# Define model and setup tensorboard
model = tflearn.DNN(net, tensorboard_dir=chatbot_db_folder + 'tflearn_logs')
# Start training (apply gradient descent algorithm)
model.fit(train_x, train_y, n_epoch=1000, batch_size=8)
model.save(chatbot_db_folder + 'model.tflearn')


# In[17]:


# save all of our data structures
import pickle
pickle.dump(
    {
        'words':words, 
        'classes':classes, 
        'train_x':train_x, 
        'train_y':train_y
    }, 
    open( chatbot_db_folder + "trained_datas", "wb" ) 
)

