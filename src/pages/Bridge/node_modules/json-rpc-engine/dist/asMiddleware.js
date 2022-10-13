"use strict";
module.exports = function asMiddleware(engine) {
    return function engineAsMiddleware(req, res, next, end) {
        engine._runAllMiddleware(req, res)
            .then(async ({ isComplete, returnHandlers }) => {
            if (isComplete) {
                await engine._runReturnHandlers(returnHandlers);
                return end();
            }
            return next(async (handlerCallback) => {
                try {
                    await engine._runReturnHandlers(returnHandlers);
                }
                catch (err) {
                    return handlerCallback(err);
                }
                return handlerCallback();
            });
        })
            .catch((error) => {
            end(error);
        });
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNNaWRkbGV3YXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FzTWlkZGxld2FyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUEsaUJBQVMsU0FBUyxZQUFZLENBQUMsTUFBcUI7SUFDbEQsT0FBTyxTQUFTLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUc7UUFDcEQsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7YUFDL0IsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUUsRUFBRSxFQUFFO1lBRTdDLElBQUksVUFBVSxFQUFFO2dCQUNkLE1BQU0sTUFBTSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNoRCxPQUFPLEdBQUcsRUFBRSxDQUFDO2FBQ2Q7WUFFRCxPQUFPLElBQUksQ0FBQyxLQUFLLEVBQUUsZUFBZSxFQUFFLEVBQUU7Z0JBQ3BDLElBQUk7b0JBQ0YsTUFBTSxNQUFNLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUM7aUJBQ2pEO2dCQUFDLE9BQU8sR0FBRyxFQUFFO29CQUNaLE9BQU8sZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUM3QjtnQkFDRCxPQUFPLGVBQWUsRUFBRSxDQUFDO1lBQzNCLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO2FBQ0QsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDZixHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDYixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyJ9