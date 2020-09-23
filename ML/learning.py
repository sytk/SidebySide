import tensorflow as tf
from tensorflow import keras
import numpy as np

X_train = np.load('./X_train.npy')
Y_train = np.load('./Y_train.npy')
X_test = np.load('./X_test.npy')
Y_test = np.load('./Y_test.npy')
print(X_train.shape)
print(X_train.min())

model = keras.Sequential([
    # keras.layers.Flatten(input_shape=(28, 28)),
    keras.layers.Input(42),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dense(10, activation='softmax')
])
#
# inputs = keras.layers.Input(shape=(42))
# x = keras.layers.Dense(128, activation='relu')(inputs)
# outputs = keras.layers.Dense(10, activation='softmax')(x)

# inputs = keras.layers.Dense(128, activation='relu', input_dim=42)
# outputs = keras.layers.Dense(10, activation='softmax')(inputs)


# model = keras.models.Model(inputs=inputs, outputs=outputs)

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

model.fit(X_train,
             Y_train,
            epochs=100,
            batch_size=128,
            validation_data=(X_test, Y_test),
            verbose=2)
# test_loss, test_acc = model.evaluate(X_test, Y_test, verbose=2)
# print('\nTest accuracy:', test_acc)
model.save('./model.h5')
# keras.models.save_model(model, )

# import tensorflowjs as tfjs
# tfjs.converters.save_keras_model(model, 'tfjs', quantization_dtype=np.uint8)
