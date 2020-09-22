import os
from torch.utils.data import Dataset
from torch.utils.data import DataLoader
import torch
import torch.nn as nn
import numpy as np
import matplotlib.pyplot as plt

class MyImageDataset(Dataset):  # 画像用 Dataset クラス
    def __init__(self, data):
        self.image = data[0]
        self.label = data[1]

    def __len__(self):
        return self.image.shape[0]

    def __getitem__(self, index):#ローダを介すとtorch tensorになる
        f_image = self.image[index].numpy().astype(np.float32)
        # return {'image': f_image, 'label': self.label[index]}
        return [f_image, self.label[index]]

class MyImageNetwork(nn.Module):  # 画像識別用ネットワークモデル
    def __init__(self, num_classes):
        super().__init__()
        self.block1 = nn.Sequential(
            nn.Conv2d(3,64,3),
            nn.ReLU(),
            nn.Conv2d(64,64,3),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Dropout(0.25)
        )
        self.block2 = nn.Sequential(
            nn.Conv2d(64,128,3),
            nn.ReLU(),
            nn.Conv2d(128,128,3),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Dropout(0.25)
        )
        self.full_connection = nn.Sequential(
            # nn.Linear(42, 128),
            # nn.ReLU(),

            # nn.Linear(128, 64),
            # nn.ReLU(),

            # nn.Dropout(),
            nn.Linear(42, num_classes)
        )
        self.optimizer = torch.optim.Adam(self.parameters(), lr=3e-4)

    def forward(self, x):
        # x = self.block1(x)
        # x = self.block2(x)
        # x = torch.flatten(x, start_dim=1)  # 値を１次元化
        x = self.full_connection(x)
        return x #クロスエントロピーにはsoftmaxが入ってるらしい
        # return torch.softmax(x, dim=1)  # SoftMax 関数の計算結果を出力

    def loss_function(self, estimate, target):
        return nn.functional.cross_entropy(estimate, target)  # 交差エントロピーでクラス判別

def train(loader_train, model_obj, device, total_epoch, epoch):
    model_obj.train() # モデルを学習モードに変更
    correct = 0
    log = []
    for data, targets in loader_train:

        data = data.to(device, dtype=torch.float) # GPUを使用するため，to()で明示的に指定
        targets = targets.to(device) # 同上

        model_obj.optimizer.zero_grad() # 勾配を初期化
        outputs = model_obj(data) # 順伝播の計算
        loss = model_obj.loss_function(outputs, targets) # 誤差を計算

        loss.backward() # 誤差を逆伝播させる
        model_obj.optimizer.step() # 重みを更新する

        _, predicted = torch.max(outputs.data, 1) # 確率が最大のラベルを取得
        correct += predicted.eq(targets.data.view_as(predicted)).sum() # 正解ならば正解数をカウントアップ

        log.append(loss.item())

    avg_loss = sum(log)/len(log)
    acc = 1.*correct.item() / len(train_loader.dataset)

    return avg_loss, acc

def test(loader_test, trained_model, device):
    trained_model.eval() # モデルを推論モードに変更
    correct = 0 # 正解率計算用の変数を宣言
    log = []
    # ミニバッチごとに推論
    with torch.no_grad(): # 推論時には勾配は不要
        for data, targets in loader_test:

            data = data.to(device, dtype=torch.float) #  GPUを使用するため，to()で明示的に指定
            targets = targets.to(device) # 同上

            outputs = trained_model(data) # 順伝播の計算
            loss = trained_model.loss_function(outputs, targets) # 誤差を計算

            _, predicted = torch.max(outputs.data, 1) # 確率が最大のラベルを取得
            correct += predicted.eq(targets.data.view_as(predicted)).sum() # 正解ならば正解数をカウントアップ

            log.append(loss.item())

    avg_loss = sum(log)/len(log)
    acc = 1.*correct.item() / len(test_loader.dataset)

    return avg_loss, acc

if __name__ == '__main__':
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    batch_size = 128
    num_classes = 10
    epochs = 2000

    model = MyImageNetwork(num_classes).to(device)
    path = './1'
    if os.path.isfile(path+'/last.pt'):  # 以前の学習結果が存在する場合
        last_state = torch.load(path+'/last.pt', map_location=device)  # データファイルの読み込み

        model.load_state_dict(last_state['state_dict'])  # 学習済ネットワーク変数の代入
        last_epoch = last_state['epoch']  #　引き続きのエポック数
        min_loss = last_state['loss']  # 最小損失を継承

        print('epoch started from', last_epoch)
    else:
        last_epoch = 0
        min_loss = 1000.  # 適当に大きい数を代入

    train_data = torch.load('./train.pt')
    test_data = torch.load('./test.pt')

    train_dataset = MyImageDataset(train_data)  # 訓練用画像データ
    test_dataset = MyImageDataset(test_data)  # 検証用画像データ
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=True)

    print('Begin train')
    log = [] #lossとaccを記録するリスト
    for epoch in range(1, epochs+1):
        train_loss, train_acc = train(train_loader, model, device, epochs, epoch)
        test_loss, test_acc = test(test_loader, model, device)
        log.append([epoch+last_epoch, train_loss, test_loss, train_acc, test_acc])
        print('\n<TRAIN> ACC : {}'.format(train_acc))
        print('<TEST> ACC : {}'.format(test_acc))

    # save_dict = {'state_dict': model.state_dict(), 'epoch': epochs+last_epoch, 'loss': train_loss}
    # torch.save(save_dict, path+'/last.pt')
    #
    # import csv
    # with open(path+'/log.csv', 'a+') as f:
    #     writer = csv.writer(f, lineterminator='\n') # 改行コード（\n）を指定しておく
    #     f.seek(0) #読み込み位置を先頭に
    #     if len(f.read()) == 0: #先頭に凡例
    #        writer.writerow(['epochs', 'train_loss', 'test_loss', 'train_acc', 'test_acc'])
    #     writer.writerows(log)
