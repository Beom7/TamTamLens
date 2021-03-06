// library
const express = require('express')

// model
const VideoModel = require('../models/VideoModel')
const ChannelModel = require('../models/ChannelModel')
const CompanyModel = require('../models/CompanyModel')

// Routes
const searchRoutes = express.Router()

// API

// 구독자 순서로 TOP 5
searchRoutes.get('/subscribe', async (req, res) => {
  if (req.headers.token) {
    try {
      const channelAll = await ChannelModel.find().sort({ channel_subscribe: -1 }).limit(5)
      res.status(200).send(channelAll)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 서비스입니다.' })
  }
})

// 구독자 전체
searchRoutes.get('/subscribes', async (req, res) => {
  if (req.headers.token) {
    const limit = parseInt(req.headers.limit)
    try {
      let channelAll = await ChannelModel.find().sort({ channel_subscribe: -1 })
      channelAll = channelAll.slice(limit, limit + 10)
      res.status(200).send(channelAll)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 서비스입니다.' })
  }
})

// 구독자 대비 평균 조회수 TOP 5
searchRoutes.get('/avgview', async (req, res) => {
  if (req.headers.token) {
    try {
      const channelAll = await ChannelModel.find()

      for (let i = 0; i < channelAll.length; i++) {
        const videos = await VideoModel.find({ channel_id: channelAll[i]._id })

        let totalview = 0
        for (let j = 0; j < videos.length; j++) {
          totalview += videos[j].video_views
        }
        let result = 0
        if (channelAll[i].channel_subscribe === 0) {
          result = 0
        } else {
          result = totalview / channelAll[i].channel_subscribe
          result = result.toFixed(3)
        }
        await ChannelModel.findOneAndUpdate({ _id: channelAll[i]._id }, { channel_avg_views: result })
      }
      const youtubers = await ChannelModel.find().sort({ channel_avg_views: -1 }).limit(5)
      res.status(200).send(youtubers)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 서비스입니다.' })
  }
})

// 구독자 대비 평균 조회수
searchRoutes.get('/avgviews', async (req, res) => {
  if (req.headers.token) {
    const limit = parseInt(req.headers.limit)
    try {
      const channelAll = await ChannelModel.find()

      for (let i = 0; i < channelAll.length; i++) {
        const videos = await VideoModel.find({ channel_id: channelAll[i]._id })

        let totalview = 0
        for (let j = 0; j < videos.length; j++) {
          totalview += videos[j].video_views
        }
        let result = 0
        if (channelAll[i].channel_subscribe === 0) {
          result = 0
        } else {
          result = totalview / channelAll[i].channel_subscribe
          result = result.toFixed(3)
        }
        await ChannelModel.findOneAndUpdate({ _id: channelAll[i]._id }, { channel_avg_views: result })
      }
      let youtubers = await ChannelModel.find().sort({ channel_avg_views: -1 })
      youtubers = youtubers.slice(limit, limit + 10)
      res.status(200).send(youtubers)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 서비스입니다.' })
  }
})

// 추천영상
searchRoutes.get('/recommend', async (req, res) => {
  if (req.headers.token) {
    try {
      const company = await CompanyModel.findOne({ _id: req.headers.companyid })
      const mynickname = company.company_nickname
      const videos_title = await VideoModel.find({ video_title: { $regex: mynickname, $options: 'i' } }).populate(
        'company_id'
      )
      const videos_content = await VideoModel.find({ videos_content: { $regex: mynickname, $options: 'i' } }).populate(
        'company_id'
      )
      const temp = videos_title.concat(videos_content)
      let recommendvideos = Array.from(new Set(temp))

      recommendvideos.sort(function () {
        return Math.random() - Math.random()
      })

      if (recommendvideos.length > 10) {
        recommendvideos = recommendvideos.slice(0, 10)
      }
      res.status(200).send(recommendvideos)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 서비스입니다' })
  }
})

// 카테고리 별 유튜버 추천
searchRoutes.get('/catechannel', async (req, res) => {
  if (req.headers.token) {
    try {
      const companyId = req.headers.companyid
      const company = await CompanyModel.findOne({ _id: companyId })
      const channels = await ChannelModel.find({
        channel_category: { $regex: company.company_industry, $options: 'i' }
      })
      channels.sort(function () {
        return Math.random() - Math.random()
      })

      let recochannel = {}
      if (channels.length > 10) {
        recochannel = channels.slice(0, 10)
        res.status(200).send(recochannel)
      } else {
        res.status(200).send(channels)
      }
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 기능입니다.' })
  }
})

// 카테고리 별 영상 추천
searchRoutes.get('/catevideo', async (req, res) => {
  if (req.headers.token) {
    try {
      const companyId = req.headers.companyid
      const company = await CompanyModel.findOne({ _id: companyId })
      const videos = await VideoModel.find({ video_category: { $regex: company.company_industry } }).populate(
        'channel_id'
      )
      videos.sort(function () {
        return Math.random() - Math.random()
      })

      let recovideo = {}
      if (videos.length > 10) {
        recovideo = videos.slice(0, 10)
      }
      res.status(200).send(recovideo)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 기능입니다.' })
  }
})

// 카테고리별 영상 조회수 순서로
searchRoutes.get('/catevideotop', async (req, res) => {
  if (req.headers.token) {
    try {
      const videos = await VideoModel.find({ video_category: { $regex: req.headers.companyindustry } }).sort({
        video_views: -1
      })
      const limit = req.headers.limit
      let result = {}
      if (videos.length < 10) {
        result = videos
      } else {
        result = videos.slice(limit, limit + 10)
      }
      res.status(200).send(result)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 기능입니다.' })
  }
})

// 카테고리별 좋아요 많은 영상 순서로
searchRoutes.get('/likevideotop', async (req, res) => {
  if (req.headers.token) {
    try {
      const videos = await VideoModel.find({
        video_category: { $regex: req.headers.companyindustry, $options: 'i' }
      }).sort({
        video_like: -1
      })

      const limit = req.headers.limit

      let result = {}
      if (videos.length < 10) {
        result = videos
      } else {
        result = videos.slice(limit, limit + 10)
      }
      res.status(200).send(result)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 기능입니다.' })
  }
})

// 검색
searchRoutes.get('/:content', async (req, res) => {
  if (req.headers.token) {
    const content = req.params.content
    try {
      const videos = await VideoModel.find({ video_title: { $regex: content, $options: 'i' } })
      for (let i = 0; i < videos.length; i++) {
        for (let j = 0; j < videos[i].video_record.length; j++) {
          const company = await CompanyModel.findOne({ _id: videos[i].video_record[j].company_id })
          videos[i].video_record[j].company_id = company
        }
      }
      const channels = await ChannelModel.find({ channel_name: { $regex: content, $options: 'i' } })
      const searchData = { videos: videos, channels: channels }
      res.status(200).send(searchData)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 서비스입니다.' })
  }
})

module.exports = searchRoutes
