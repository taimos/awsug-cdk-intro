from aws_cdk import (
    aws_events as events,
    aws_lambda as lambda_,
    aws_iam as iam_,
    aws_events_targets as targets,
    core,
)


class PythonStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        lambdaFn = lambda_.Function(
            self, "WhoAmIFunction",
            code=lambda_.Code.asset("./code"),
            handler="index.lambda_handler",
            timeout=core.Duration.seconds(300),
            runtime=lambda_.Runtime.PYTHON_3_7,
            initial_policy=[
                iam_.PolicyStatement(
                    actions=['sts:GetCallerIdentity'], 
                    resources=['*']
                ),
            ]
        )

        rule = events.Rule(self, "Rule", schedule=events.Schedule.rate(core.Duration.minutes(10)))
        rule.add_target(targets.LambdaFunction(lambdaFn))
