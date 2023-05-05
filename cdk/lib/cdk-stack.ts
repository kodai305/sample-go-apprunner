import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as ecrdeploy from 'cdk-ecr-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

const generateRandomString = (charCount = 7): string => {
  const str = Math.random().toString(36).substring(2).slice(-charCount)
  return str.length < charCount ? str + 'a'.repeat(charCount - str.length) : str
};

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * ECR関連
     */
    // リポジトリの作成
    const repository = new ecr.Repository(this, "cdk-app-runner-sample-repo", {
      repositoryName: 'cdk-app-runner-sample-repo',
      removalPolicy: RemovalPolicy.DESTROY
    });

    // tag
    const tag = generateRandomString();
    
    // ビルド to CDKデフォルトリポジトリ
    const image = new DockerImageAsset(this, 'CDKAppRunnerSampleImage', {
      directory: '../app',
      platform: Platform.LINUX_AMD64, // App RunnerがARMが対応していないっぽい
    });
    // ビルドしたイメージをコピー
    new ecrdeploy.ECRDeployment(this, 'DeploySampleECRImage', {
      src: new ecrdeploy.DockerImageName(image.imageUri),
      dest: new ecrdeploy.DockerImageName(repository.repositoryUri + ':' + tag),
    });    


    /**
     * App Runner
     */
    // Apprunner
    new apprunner.Service(this, 'AppRunnerSampleService', {
      source: apprunner.Source.fromEcr({
        imageConfiguration: {
          port: 80, // Webサーバーのポート
        },
        repository,
        tag: tag,
      }),
    })    
  }
}
