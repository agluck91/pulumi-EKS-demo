import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

const vpc = new aws.ec2.Vpc("vpc", { cidrBlock: "172.16.0.0/16" });
const subnet = new aws.ec2.Subnet("subnet", {
  vpcId: vpc.id,
  cidrBlock: "172.16.1.0/24",
});

const cluster = new eks.Cluster("eksk8appdemo-cluster", {
  vpcId: vpc.id,
  subnetIds: [subnet.id],
  instanceType: "t2.medium",
  desiredCapacity: 2,
  minSize: 1,
  maxSize: 2,
  deployDashboard: false,
});

const appLabels = { app: "eksk8appdemo" };
const deployment = new k8s.apps.v1.Deployment(
  "eksk8appdemo-deployment",
  {
    metadata: { labels: appLabels },
    spec: {
      replicas: 3,
      selector: { matchLabels: appLabels },
      template: {
        metadata: { labels: appLabels },
        spec: {
          containers: [
            {
              name: "eksk8appdemo",
              image:
                "139539663033.dkr.ecr.us-east-1.amazonaws.com/eksk8appdemo:latest",
            },
          ],
        },
      },
    },
  },
  { provider: cluster.provider }
);

// Export the clusters' kubeconfig.
export const kubeconfig = cluster.kubeconfig;
export const deploymentName = deployment.metadata.name;
export const deploymentNamespace = deployment.metadata.namespace;
