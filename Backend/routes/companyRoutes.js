// library
const express = require('express')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const secretObj = require('../config/jwt')

// Model
const CompanyModel = require('../models/CompanyModel')

// Routes
const companyRoutes = express.Router()

// 변수
const admin_id = '5f9fbfb11fd2143df8c009ea'

// 함수
const hashpassword = (password) => {
  return crypto.createHash('sha512').update(password).digest('hex')
}

// API

// 회원가입
companyRoutes.post('/signup', async (req, res) => {
  try {
    const companyEmail = req.body.company_email
    const companyPwd = req.body.company_pwd
    const companyNick = req.body.company_nickname
    const companyIndustry = req.body.company_industry

    const item = new CompanyModel({
      company_email: companyEmail,
      company_pwd: hashpassword(companyPwd),
      company_nickname: companyNick,
      company_industry: companyIndustry
    })
    await item.save()
    res.status(200).send({
      message: `${companyEmail} 회원가입이 완료되었습니다.`
    })
  } catch (err) {
    res.status(500).send(err)
  }
})

// 로그인
companyRoutes.post('/signin', async (req, res) => {
  if (req.headers.token) {
    res.status(403).json({ message: '이미 로그인 되어있습니다.' })
  } else {
    const companyEmail = req.body.company_email
    const companyPwd = hashpassword(req.body.company_pwd)

    await CompanyModel.findOne({ company_email: companyEmail })
      .then((company) => {
        if (company.company_pwd !== companyPwd) {
          res.status(403).send({ message: '비밀번호가 다릅니다.' })
        } else {
          jwt.sign(
            { company_email: company.company_email },
            secretObj.secret,
            { expiresIn: '1d' },

            function (err, token) {
              if (err) {
                res.send(err)
              } else {
                res.json({
                  message: '로그인 성공, 토큰을 발급합니다.',
                  token: token,
                  status: 'login',
                  company_email: company.company_email,
                  company_id: company._id,
                  company_exception: company.company_exception,
                  company_video: company.company_video,
                  company_channel: company.company_channel,
                  company_contact: company.company_contact,
                  company_pwd: company.company_pwd,
                  company_nickname: company.company_nickname
                })
              }
            }
          )
        }
      })
      .catch(() => {
        res.status(403).send({
          message: '존재하지 않는 아이디입니다.'
        })
      })
  }
})

// 회원탈퇴
companyRoutes.delete('/delete', async (req, res) => {
  try {
    await CompanyModel.findOne({ company_id: req.headers._id }).then(async (company) => {
      if (company === null) {
        res.status(403).send({ message: '존재하지 않는 아이디 입니다.' })
      } else {
        // 다른 모델에서도 회원 정보를 지워줘야 한다.
        await CompanyModel.deleteOne({ company_email: company.company_email })
        res.status(200).send({ message: '회원 탈퇴 되었습니다.' })
      }
    })
  } catch (err) {
    res.status(500).send(err)
  }
})

// 모든 회원조회
companyRoutes.get('/', async (req, res) => {
  if (req.headers.company_id === admin_id) {
    try {
      const companyAll = await CompanyModel.find()
      res.status(200).send(companyAll)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '접근이 제한되었습니다.' })
  }
})

// 스크랩 비디오 조회
companyRoutes.get('/video', async (req, res) => {
  if (req.headers.token) {
    try {
      await CompanyModel.findOne({
        _id: req.headers.company_id
      })
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 서비스입니다.' })
  }
})

// 스크랩 채널 조회
companyRoutes.get('/channel', async (req, res) => {
  if (req.headers.token) {
    try {
      const company = await CompanyModel.findOne({
        _id: req.headers.company_id
      }).populate('company_channel')
      res.status(200).send(company)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 서비스입니다.' })
  }
})

// 닉네임 조회
companyRoutes.get('/nick', async (req, res) => {
  if (req.headers.company_id) {
    const company = await CompanyModel.findOne({
      _id: req.headers.company_id
    })
    res.status(200).send(company.company_nickname)
  } else {
    res.status(403).send({ message: '로그인이 필요한 서비스입니다.' })
  }
})

// 컨택 채널 조회
companyRoutes.get('/contact', async (req, res) => {
  if (req.headers.token) {
    try {
      const company = await CompanyModel.findOne({
        _id: req.headers.company_id
      }).populate('company_contact')
      res.status(200).send(company.company_contact)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '로그인이 필요한 서비스입니다.' })
  }
})

// 제외 영상 조회
companyRoutes.get('/exception', async (req, res) => {
  if (req.headers.token) {
    // const company = await CompanyModel.findOne({ _id: req.headers.company_id }).populate('company_exception')
  } else {
    res.status(403).send({ message: '회원만 조회할 수 있습니다.' })
  }
})

// 회원조회
companyRoutes.get('/:company_id', async (req, res) => {
  const companyId = req.params.company_id
  if (companyId === req.headers.company_id) {
    try {
      const companyOne = await CompanyModel.findOne({ _id: companyId })
      res.status(200).send(companyOne)
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.status(403).send({ message: '접근이 제한되었습니다.' })
  }
})

module.exports = companyRoutes
