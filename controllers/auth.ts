import { Request, Response, NextFunction } from 'express';
import { firebaseHelper } from '../utils/index';
import bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import { ActiveStatus, Sites } from '../constants/enum';

export const register = async (req: Request, res: Response) => {
  const {
    email,
    password,
    username,
    fullName,
    phone,
    avatar_url,
    ranks,
    points,
    roles,
    permissions,
  } = req.body;
  let uid: string;
  let authUser: admin.auth.UserRecord | null = null;
  try {
    if (password) {
      authUser = await admin.auth().createUser({
        email,
        password,
        displayName: fullName,
      });
      uid = authUser.uid;
    } else {
      const tempUser = await admin.auth().createUser({ email });
      uid = tempUser.uid;
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const userData = {
      id: uid,
      uid,
      email,
      username,
      password: hashedPassword,
      fullName,
      phone,
      avatar_url: avatar_url || null,
      ranks: ranks || null,
      points: points ?? 0,
      roles: roles,
      permissions: permissions || [],
      status: ActiveStatus.INACTIVE,
      updated_at: null,
      updated_by: null,
    };

    const result = await firebaseHelper.createDoc(`${Sites.TOKYO}/users`, userData);
    if (!result) {
      res.status(400).json({
        status: false,
        message: 'Create user failed.',
      });
      return;
    }
    const { password: _, ...safeUser } = userData;
    return res.status(201).json({
      success: true,
      message: 'Register successfully',
      data: safeUser,
    });
  } catch (err: any) {
    if (err.code?.startsWith('auth/')) {
      res.status(400).json({
        success: false,
        message: '[User][Create] Firebase Auth error!',
      });
    }
    res.status(400).json({
      success: false,
      message: '[User][Create] Request failed!',
    });
  }
};
