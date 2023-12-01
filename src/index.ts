import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import * as helm from "@pulumi/kubernetes/helm";

const vpc = new aws.ec2.Vpc("vpc", { cidrBlock: "172.16.0.0/16" });

// Create two subnets in different Availability Zones
const subnetA = new aws.ec2.Subnet("subnetA", {
  vpcId: vpc.id,
  cidrBlock: "172.16.1.0/24",
  availabilityZone: "us-east-1a", // Specify AZ 'a'
});

const subnetB = new aws.ec2.Subnet("subnetB", {
  vpcId: vpc.id,
  cidrBlock: "172.16.2.0/24",
  availabilityZone: "us-east-1b", // Specify AZ 'b'
});

const cluster = new eks.Cluster("eksk8appdemo-cluster", {
  vpcId: vpc.id,
  subnetIds: [subnetA.id], // Use subnetA instead of subnet
  instanceType: "t2.medium",
  desiredCapacity: 2,
  minSize: 1,
  maxSize: 2,
  deployDashboard: false,
});

const appLabels = { app: "eksk8appdemo" };

// Defined the image variable
const image =
  "139539663033.dkr.ecr.us-east-1.amazonaws.com/eksk8appdemo:latest";

// Namespace to install helm chart
const namespace = new k8s.core.v1.Namespace("eksdemoapp", undefined, {
  provider: cluster.provider,
});

// Helm chart values
const chartValues = {
  replicaCount: 3,
  image: {
    repository: image,
  },
  labels: appLabels,
};

const deploymentName = "eksk8appdemo-deployment";

// Installing Helm chart
const chart = new helm.v3.Chart(
  "myChart",
  {
    chart: "eksdemoappchart",
    version: "1.1.0", // specify the version of the chart to install
    fetchOpts: { repo: "eksdemoapp-chart-repo" }, // specify the repo of the chart
    namespace: namespace.metadata.name,
    values: chartValues,
    transformations: [
      (obj) => {
        if (obj.kind === "Deployment") {
          obj.metadata.name = deploymentName;
          obj.metadata.namespace = namespace.metadata.name;
        }
      },
    ],
  },
  {
    provider: cluster.provider,
  }
);

// Export the clusters' kubeconfig, deployment name, and namespace.
export const kubeconfig = cluster.kubeconfig;
export const deploymentNamespace = namespace.metadata.name;

// As we know name of deployment from helm transformations
export const deploymentNameOutput = deploymentName;
