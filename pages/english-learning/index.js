// 导入配置文件
const { token } = require('./config.js');
// 配置开关和模拟数据
const CONFIG = {
  USE_REAL_API: false, // 控制是否使用真实API的开关
  MOCK_DELAY: 500,
  // 使用条件编译
  API_TOKEN: token
};

// 不同 workflow 的模拟响应
const MOCK_RESPONSES = {
  '7433005944231854131': { // 学习单词的 workflow
    code: 0,
    cost: "0",
    data: '{"audio_url":"https://lf-bot-studio-plugin-resource.coze.cn/obj/bot-studio-platform-plugin-tos/sami/tts/496abef696134e6794f5ee06633a4212.mp3","image_url":"https://p9-bot-workflow-sign.byteimg.com/tos-cn-i-mdko3gqilj/ca1a39c3c6a74f5a94eb99c4412ca960.png~tplv-mdko3gqilj-image.png?rk3s=c8fe7ad5&x-expires=1761837933&x-signature=PX1Nqu3EJcubO%2Fknor6IynavoPI%3D","word":"tiger"}',
    debug_url: "https://www.coze.cn/work_flow?execute_id=7433445493507997750&space_id=7432929629691789346&workflow_id=7433005944231854131",
    msg: "Success",
    token: 730
  },
  '7433005944232362035': { // 反馈的 workflow
    code: 0,
    cost: "0",
    data: '{"audio_url":"https://lf-bot-studio-plugin-resource.coze.cn/obj/bot-studio-platform-plugin-tos/sami/tts/496abef696134e6794f5ee06633a4212.mp3","image_url":"https://p9-bot-workflow-sign.byteimg.com/tos-cn-i-mdko3gqilj/ca1a39c3c6a74f5a94eb99c4412ca960.png~tplv-mdko3gqilj-image.png?rk3s=c8fe7ad5&x-expires=1761837933&x-signature=PX1Nqu3EJcubO%2Fknor6IynavoPI%3D","word":"tiger"}',
    debug_url: "https://www.coze.cn/work_flow?execute_id=7433445493507997750&space_id=7432929629691789346&workflow_id=7433005944231854131",
    msg: "Success",
    token: 730
  },
  '7433005944232214579': {
    "code": 0,
    "cost": "0",
    "data": "{\"content_type\":1,\"data\":\"{\\\"topic\\\":\\\"动物园主题\\\",\\\"vocabulary_list\\\":[\\\"zebra\\\",\\\"giraffe\\\",\\\"lion\\\",\\\"tiger\\\",\\\"elephant\\\",\\\"monkey\\\",\\\"bear\\\",\\\"fox\\\",\\\"deer\\\",\\\"rabbit\\\"]}\",\"original_result\":null,\"type_for_model\":2}",
    "debug_url": "https://www.coze.cn/work_flow?execute_id=7433825898807607333\u0026space_id=7432929629691789346\u0026workflow_id=7433005944232214579",
    "msg": "Success",
    "token": 913
}
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
    ],
    userInfo: null,
    hasUserInfo: false,
    currentTheme: '', // 当前选择的主题
    themeWords: [], // 主题相关的单词列表
    showThemeWords: false, // 是否显示主题单词列表
  },

  onLoad: function() {
    // 尝试从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    }
  },

  // 处理头像选择
  onChooseAvatar(e) {
    console.log('选择头像', e.detail);
    const { avatarUrl } = e.detail;
    
    this.setData({
      'userInfo.avatarUrl': avatarUrl
    });
    
    // 如果已经有昵称，则保存用户信息
    if (this.data.userInfo && this.data.userInfo.nickName) {
      this._saveUserInfo();
    }
  },

  // 处理昵称输入
  onInputNickname(e) {
    console.log('输入昵称', e.detail);
    const nickName = e.detail.value;
    
    this.setData({
      'userInfo.nickName': nickName
    });
    
    // 如果已经有头像，则保存用户信息
    if (this.data.userInfo && this.data.userInfo.avatarUrl) {
      this._saveUserInfo();
    }
  },

  // 保存用户信息
  _saveUserInfo() {
    const userInfo = this.data.userInfo;
    if (userInfo.avatarUrl && userInfo.nickName) {
      wx.setStorageSync('userInfo', userInfo);
      this.setData({
        hasUserInfo: true
      });
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    }
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

  async callCozeAPI(word, workflowId = '7433005944231854131') {
    try {
      // 使用模拟数据
      if (!CONFIG.USE_REAL_API) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.MOCK_DELAY));
        return MOCK_RESPONSES[workflowId];
      }
      
      // 创建等待提示的定时器
      let currentChatList = [...this.data.chatList];
      const waitingMessages = [
        { delay: 3000, message: '正在学习读音...' },
        { delay: 10000, message: '正在生成卡片...' }
      ];
      
      const timers = waitingMessages.map(({ delay, message }) => {
        return setTimeout(() => {
          currentChatList = [...currentChatList, {
            type: 'system',
            content: message
          }];
          this.setData({
            chatList: currentChatList,
            scrollToView: `chat-${currentChatList.length - 1}`
          });
        }, delay);
      });
      
      const result = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://api.coze.cn/v1/workflow/run',
          method: 'POST',
          header: {
            'Authorization': `Bearer ${CONFIG.API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          data: {
            workflow_id: workflowId,
            bot_id: '7433313061958221824',
            parameters: {
              BOT_USER_INPUT: word
            },
            is_async: false
          },
          timeout: 30000,
          success: (res) => {
            // 清除所有定时器
            timers.forEach(timer => clearTimeout(timer));
            // 移除等待提示消息
            this.setData({
              chatList: this.data.chatList.filter(msg => msg.type !== 'system')
            });
            console.log('API Response:', res);
            resolve(res.data);
          },
          fail: (error) => {
            // 清除所有定时器
            timers.forEach(timer => clearTimeout(timer));
            // 移除等待提示消息
            this.setData({
              chatList: this.data.chatList.filter(msg => msg.type !== 'system')
            });
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
    await this.sendWord();
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url, // 当前显示图片的链接
      urls: [url]   // 需要预览的图片链接列表
    });
  },

  async markAsLearned() {
    const lastAiMessage = this.data.chatList.findLast(msg => msg.type === 'ai');
    if (lastAiMessage) {
      wx.showToast({
        title: '太棒了！继续下一个',
        icon: 'success',
        duration: 1000
      });
      await this.sendFeedback(lastAiMessage.word, '7433005944232362035');
    }
  },

  async skipWord() {
    const lastAiMessage = this.data.chatList.findLast(msg => msg.type === 'ai');
    if (lastAiMessage) {
      wx.showToast({
        title: '换一个试试',
        icon: 'none',
        duration: 1000
      });
      await this.sendFeedback(lastAiMessage.word, '7433005944232362035');
    }
  },

  async sendFeedback(word, workflowId) {
    try {
      wx.showLoading({
        title: '正在获取新卡片...',
      });

      const response = await this.callCozeAPI(word, workflowId);
      console.log('Feedback Response:', response);

      if (response && response.code === 0) {
        const responseData = JSON.parse(response.data);
        console.log('Parsed Feedback Data:', responseData);
        
        // 添加新的卡片到聊天列表，与 sendWord 保持一致的处理逻辑
        const newChatList = [...this.data.chatList, {
          type: 'ai',
          imageUrl: responseData.image_url || '',
          audioUrl: responseData.audio_url || '',
          word: responseData.word || ''
        }];
        
        this.setData({
          chatList: newChatList,
          scrollToView: `chat-${newChatList.length - 1}`
        });

      } else {
        throw new Error(response?.msg || 'API 调用失败');
      }
    } catch (error) {
      console.error('Get New Card Error:', error);
      wx.showToast({
        title: error.message || '获取新卡片失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 添加主题选择方法
  async selectTheme(e) {
    const theme = e.currentTarget.dataset.theme;
    let themeText = '';
    
    switch(theme) {
      case 'animal':
        themeText = '动物园主题';
        break;
      case 'plant':
        themeText = '植物园主题';
        break;
      case 'ocean':
        themeText = '海洋馆主题';
        break;
    }

    try {
      wx.showLoading({
        title: '正在获取单词列表...',
      });

      const response = await this.callCozeAPI(themeText, '7433005944232214579');
      
      if (response && response.code === 0) {
        // 解析两层 JSON 数据
        const outerData = JSON.parse(response.data);
        const innerData = JSON.parse(outerData.data);
        console.log('Theme Response:', innerData);

        this.setData({
          currentTheme: theme,
          themeWords: innerData.vocabulary_list,
          showThemeWords: true,
          showVocabList: false // 隐藏默认词汇列表
        });

        // 滚动到单词列表
        this.setData({
          scrollToView: 'theme-words'
        });
      }
    } catch (error) {
      console.error('Theme Selection Error:', error);
      wx.showToast({
        title: error.message || '获取主题单词失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 选择主题单词
  selectThemeWord(e) {
    const word = e.currentTarget.dataset.word;
    this.setData({
      showThemeWords: false,
      inputWord: word
    });
    this.sendWord();
  },
}); 