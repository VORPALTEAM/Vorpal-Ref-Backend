import { Request, Response, NextFunction } from "express";
import { requestUserData, updateUserDataAction } from "../models/admin/user"
import { requestAdminData, saveNewData } from "../models/admin"
import { requestPublicData } from "../models/open"

export const getProjectData = async (req: Request, res: Response) => {

    const resp = JSON.stringify({
      content: await requestPublicData(req.params.project)
    })
  
    res.status(200).send(resp)
  
  }

export const adminDataRequest = async (req: Request, res: Response) => {

  const authResult = await requestAdminData(req.body)
  console.log (authResult)
  res.status(200).send(JSON.stringify({
     data : authResult
  }))
}

export const adminSaveData = async (req: Request, res: Response) => {

  const saveResult = await saveNewData (req.body)
  res.status(200).send(JSON.stringify({
    data : saveResult
 }))
}

export const getAdminUserData = async (req: Request, res: Response) => {

  const Users = await requestUserData ( req.body )

  res.status(200).send(JSON.stringify({
    data : Users
 }))
}

export const adminUpdateUserData = async (req: Request, res: Response) => {


  const updateReport = await updateUserDataAction (req.body)

  res.status(200).send(JSON.stringify({
    data : updateReport
 }))
}