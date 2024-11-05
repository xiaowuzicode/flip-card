// 使用真实格式的模拟数据
const mockApiResponse = {
  code: 0,
  cost: "0",
  data: '{"audio_url":"https://lf-bot-studio-plugin-resource.coze.cn/obj/bot-studio-platform-plugin-tos/sami/tts/496abef696134e6794f5ee06633a4212.mp3","image_url":"https://p9-bot-workflow-sign.byteimg.com/tos-cn-i-mdko3gqilj/ca1a39c3c6a74f5a94eb99c4412ca960.png~tplv-mdko3gqilj-image.png?rk3s=c8fe7ad5&x-expires=1761837933&x-signature=PX1Nqu3EJcubO%2Fknor6IynavoPI%3D","word":"tiger"}',
  debug_url: "https://www.coze.cn/work_flow?execute_id=7433445493507997750&space_id=7432929629691789346&workflow_id=7433005944231854131",
  msg: "Success",
  token: 730
};

Page({
  data: {
    inputWord: '',
    chatList: [],
    scrollToView: '',
    showVocabList: true,
    vocabularyList: [
      'cloth',
      'skirt',
      'shirt',
      'dress',
      'sock',
      'shoe',
      'cap',
      'bag',
      'money',
      'price'
    ]
  },

  selectWord(e) {
    const word = e.currentTarget.dataset.word;
    this.setData({
      showVocabList: false,
      inputWord: word
    });
    this.sendWord();
  },

  onInputChange(e) {
    this.setData({
      inputWord: e.detail.value
    });
  },

  async sendWord() {
    if (!this.data.inputWord.trim()) return;
    
    const word = this.data.inputWord;
    
    const newChatList = [...this.data.chatList, {
      type: 'user',
      content: word
    }];
    
    this.setData({
      chatList: newChatList,
      inputWord: ''
    });

    try {
      wx.showLoading({
        title: '正在获取回复...',
      });

      const response = await this.callCozeAPI(word);
      console.log('Final API Response:', response);

      wx.hideLoading();

      if (response && response.code === 0) {
        const responseData = JSON.parse(response.data);
        console.log('Parsed Response Data:', responseData);

        newChatList.push({
          type: 'ai',
          imageUrl: responseData.image_url || '',
          audioUrl: responseData.audio_url || '',
          word: responseData.word || ''
        });
        
        this.setData({
          chatList: newChatList,
          scrollToView: `chat-${newChatList.length - 1}`
        });
      } else {
        throw new Error(response?.msg || 'API 调用失败');
      }
    } catch (error) {
      console.error('Send Word Error:', error);
      wx.showToast({
        title: error.message || '获取回复失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
    }
  },

  async callCozeAPI(word) {
    try {
      const { token } = require('./config');
      
      const result = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://api.coze.cn/v1/workflow/run',
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            workflow_id: '7433005944231854131',
            parameters: {
              BOT_USER_INPUT: word
            },
            is_async: false
          },
          timeout: 30000,
          success: (res) => {
            console.log('API Response:', res);
            resolve(res.data);
          },
          fail: (error) => {
            console.log('API Failed:', error);
            if (error.errMsg.includes('timeout')) {
              reject(new Error('请求超时，请稍后重试'));
            } else {
              reject(error);
            }
          }
        });
      });
  
      return result;
  
    } catch (error) {
      console.error('Request Error Details:', error);
      wx.showToast({
        title: error.message || '请求失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
      throw error;
    }
  },




  checkTodayWords() {
    wx.showToast({
      title: '正在查询今日学习记录...',
      icon: 'none'
    });
  },

  checkYesterdayWords() {
    wx.showToast({
      title: '正在查询昨日学习记录...',
      icon: 'none'
    });
  },

  playAudio(e) {
    const audioUrl = e.currentTarget.dataset.url;
    const audioContext = wx.createInnerAudioContext();
    audioContext.src = audioUrl;
    audioContext.play();
  },

  // 发送消息的处理函数
  async handleSend() {
    if (!this.data.inputWord.trim()) return;
    
    const newChatList = [...this.data.chatList];
    // 添加用户消息
    newChatList.push({
      type: 'user',
      content: this.data.inputWord
    });

    this.setData({
      chatList: newChatList,
      inputWord: '',
      scrollToView: `chat-${newChatList.length - 1}`
    });

    // 模拟API调用
    setTimeout(() => {
      const response = mockApiResponse;
      if (response && response.code === 0) {
        const responseData = JSON.parse(response.data);
        console.log('Parsed Response Data:', responseData);

        newChatList.push({
          type: 'ai',
          imageUrl: responseData.image_url,
          audioUrl: responseData.audio_url,
          word: responseData.word,
          translation: '老虎',  // 这里可以根据需要修改
          english: 'The tiger is a powerful animal.'  // 这里可以根据需要修改
        });

        this.setData({
          chatList: newChatList,
          scrollToView: `chat-${newChatList.length - 1}`
        });
      }
    }, 500);
  }
}); 